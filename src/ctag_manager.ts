
'use strict';
import * as vscode from 'vscode';
import {Selection, Position, DecorationRenderOptions, Range, Diagnostic, workspace, window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import * as notification from "./notification";
import * as file_manager from "./file_manager";
    
const  CTAG_COMMAND = "ctags";
const  CTAG_OPTION = "-R -F";
const  CTAGS_TAG_FILE_NAME = "tags";  
const LARGE_FILE_SIZE_BYTE : number = (10*1024*1024); // 10MB

enum Status {NONE, GENERATING, GENERATED, LOADING, LOADED};
interface Tag{
    symbol:string,
    file:string,
    pattern:string;
}

export class CTAG_Manager{
    private _ctags_tagpath : string = "";
    private _current_path :string = "";
    private _status : Status;
    private _tags: Map<string,Tag> = new Map<string,Tag>();
        
    private _reset_if_need(){
        if(this._current_path != workspace.rootPath){
            this._current_path = workspace.rootPath;
            this._ctags_tagpath = require('path').join(this._current_path, CTAGS_TAG_FILE_NAME);
            this._status = Status.NONE;
            this._tags.clear();
        }
    }
    
    private _set_tagpath(){
        this._ctags_tagpath = require('path').join(this._current_path, CTAGS_TAG_FILE_NAME);
    }
    
    private _get_tagpath() :string{
        return this._ctags_tagpath;
    }



    private _load_tags(){
        if(this._status == Status.LOADING){
            /* Already in loading, do not run again.*/
            return;
        }     
        let manager :CTAG_Manager = this;           
        this._status = Status.LOADING;
        
        if(!file_manager.test_file_size(this._ctags_tagpath, LARGE_FILE_SIZE_BYTE)){
            notification.print_error("Can't load large ctag file larger than " + LARGE_FILE_SIZE_BYTE / 1024/1024 + "MB. Loading has been cancelled");
            return;
        }
        
        
        file_manager.parse_file_line(this._ctags_tagpath,
            function(line : string){
                if(line[0] != '!'){
                    let tag:Tag = manager._extract_tag(line);
                    if(tag != null){
                        // Todo : Proof-of-concept, the first key only.
                        if(!manager._tags.has(tag.symbol)){
                            manager._tags[tag.symbol] = tag;
                        }                        
                    }
                }                  
            },
            function(){ // Error
                notification.print_error("Error on loading ctag info.");
                manager._status = Status.NONE;                
            },
            function(){ // Success
                notification.print_info("Tag information has been loaded. You can search tag now");
                manager._status = Status.LOADED;                  
            }
        );
    }
    
    private _extract_tag(line : string) : Tag{
        let info_array = line.split('\t');
        if(info_array.length < 3){
            return null;
        }
        let info : Tag = {
            symbol: info_array[0],
            file: require('path').join(this._current_path,info_array[1]),
            pattern:info_array[2].substr(info_array[2].indexOf('^')+1,info_array[2].indexOf('$') - info_array[2].indexOf('^') - 1) 
        };
        
        let prev = "";
        let replaced = info.pattern;
        do{
            prev = replaced;
            replaced = prev.replace(/\\(\$|\/|\^|\\)/,"$1");
        }while(prev != replaced);
        info.pattern = replaced;          
        return info;
    }

    private _search_tag_on_doc(tag_info :Tag){
        workspace.openTextDocument(tag_info.file).then(function(doc){
            window.showTextDocument(doc).then(function(editor){
                let text : string = doc.getText();            
                let start : Position  = doc.positionAt(text.indexOf(tag_info.pattern));
                let end : Position = doc.positionAt(text.indexOf(tag_info.pattern) + tag_info.pattern.length);
                let range = new Range(start,end);
                editor.selection = new Selection(start,end);
                })
            },function(error){
                window.showErrorMessage("Cannot find the symbol : " + tag_info.symbol);
        });        
    }
    
    private _tag_search(targetSymbol :string){
        let info = this._tags[targetSymbol];
        if(info){
            this._search_tag_on_doc(info);            
        }else{
            notification.print_error("Cannot find the symbol:" + targetSymbol);
        } 
    }
    
    private _is_large_file(file_path:string) : boolean{
        return false;
    }    
        
    constructor(){
        this._reset_if_need();
    }
    
    public search(targetSymbol : string, error: (msg : string) => any ){
        this._reset_if_need();
        var fs = require("fs");
        
        if(file_manager.file_exists(this._get_tagpath())){
            error("Cannot read ctag file. Please run CTAGS:Generate command first.");
        }else{
            if(this._status != Status.LOADED){
                error("Loading tag info.. Please wait for a while and try again");
                this._load_tags();
                return;
            } else {  
                this._tag_search(targetSymbol);          
            }            
        }
    }  
    
    public generate_tag(){
        this._reset_if_need();
        
        let parent :CTAG_Manager = this;
        
        switch(this._status){
            /* In doing something, do not run again. just return */
            case Status.GENERATING:
            case Status.LOADING:
                return;
        }
        
        this._status = Status.LOADING;
        let exec = require('child_process').exec;   
        let command :string = CTAG_COMMAND + ' ' + CTAG_OPTION;
        
        //Run ctag;
        notification.print_info("Generating ctag file...");
        exec(command,{cwd:parent._current_path},function(err,stdout,stderr){
            notification.print_info("Ctag generation has benn completed. Loading the tag file low..");
            parent._status = Status.GENERATED;
            parent._load_tags();
        });              
    }  
}   