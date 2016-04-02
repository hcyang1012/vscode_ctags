'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Selection, Position, DecorationRenderOptions, Range, Diagnostic, workspace, window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ctags" is now active!');
    let ctagsController = new CtagsController(context);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
    
   
	let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});
    context.subscriptions.push(disposable);
    
    
    
	
   
}

// this method is called when your extension is deactivated
export function deactivate() {
}

enum Status {NONE, GENERATING, GENERATED, LOADING, LOADED};
interface Tag{
    symbol:string,
    file:string,
    pattern:string;
}
class CtagsController{
    private _ctag_command = "ctags";
    private _ctags_option = "-R -F";
    private _ctags_tagfileName = "tags";
    private _ctags_tagpath;
    
    private _current_path :string = "";
    private _tag_buffer:string;
    
    private _status : Status;
    
    private _tags: Map<string,Tag> = new Map<string,Tag>();
   
   
    private _set_tagpath(){
        this._ctags_tagpath = require('path').join(this._current_path,this._ctags_tagfileName);
    }
    
    private _get_tagpath() :string{
        return this._ctags_tagpath;
    }
    
    private _reset_if_need(){
        if(this._current_path != workspace.rootPath){
            this._current_path = workspace.rootPath;
            this._status = Status.NONE;
            this._tags.clear();
        }
    }
    
    
    constructor(context : vscode.ExtensionContext){
        this._reset_if_need();
        
        let disposable = vscode.commands.registerCommand('extension.ctag_generate', ()=>{
            this.generate_tag(); 
        });
        context.subscriptions.push(disposable);
        
        disposable = vscode.commands.registerCommand('extension.ctag_search', ()=>{
            this.search(); 
        });
        context.subscriptions.push(disposable); 
                
        this._ctags_tagpath = require('path').join(this._current_path,this._ctags_tagfileName);
        console.log("CTag Extension has been initialized");    
    }
    
    private _load_tags(){
        if(this._status == Status.LOADING){
            /* Already in loading, do not run again.*/
            return;
        }     
        let controller :CtagsController = this;

                
        this._status = Status.LOADING;
        
        let fs = require('fs')
        let util = require('util')
        let es = require('event-stream');
                
        let stream = fs.createReadStream(this._ctags_tagpath).pipe(es.split()).pipe(
            es.mapSync(function(line){
                stream.pause();
                
                if(line[0] != '!'){
                    let tag:Tag = controller._extract_tag(line);
                    if(tag != null){
                        // Todo : Proof-of-concept, the first key only.
                        if(!controller._tags.has(tag.symbol)){
                            controller._tags[tag.symbol] = tag;
                        }                        
                    }

                }                
                
                stream.resume();    
            }).on('error',function(){
                print_error("Error on loading ctag info.");
                controller._status = Status.NONE;
            }).on('end',function(){
                print_info("Tag information has been loaded. You can search tag now");
                controller._status = Status.LOADED;                
            })
        );
        
        
        // let lineReader = require('readline').createInterface({
        //     input: require('fs').createReadStream(this._ctags_tagpath)
        // });
        
        // lineReader.on('line', function (line) {
        //     controller._status = Status.LOADING;
        //     let tag:Tag = controller._extract_tag(line);
            
        //     // Todo : Proof-of-concept, the first key only.
        //     if(!controller._tags.has(tag.symbol)){
        //         controller._tags[tag.symbol] = tag;
        //     }
        // });
        
        // lineReader.on('close', function(){
        //     print_info("Tag information has been loaded. You can search tag now");
        //     controller._status = Status.LOADED;
        // });
    }
    private _extract_tag(line : string){
        let info_array = line.split('\t');
        if(info_array.length < 3){
            return null;
        }
        let info = {
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
        let controller :CtagsController = this;

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
            print_error("Cannot find the symbol:" + targetSymbol);
        } 
    }
    
    public search(){
        this._reset_if_need();
        
        let controller :CtagsController = this;
        var fs = require("fs");
        fs.exists(this._get_tagpath(),function(exists){
            if(!exists){
                print_error("Cannot find ctag file. Please run CTAGS:Generate command first.");
            } else {                
                if(controller._status != Status.LOADED){
                    print_info("Loading tag info.. Please wait for a while and try again");
                    controller._load_tags();
                    return;
                } else {  
                    vscode.window.showInputBox("Input the symbol name").then(function(targetSymbol){
                        controller._tag_search(targetSymbol);
                    });                      
                }                  
            }
        }); 
    }
    public generate_tag(){
        
        this._reset_if_need();
        
        let controller :CtagsController = this;
        
        switch(this._status){
            /* In doing something, do not run again. just return */
            case Status.GENERATING:
            case Status.LOADING:
                return;
        }
        
        this._status = Status.LOADING;
        let exec = require('child_process').exec;   
        let command :string = this._ctag_command + ' ' + this._ctags_option;
        
        //Run ctag;
        print_info("Generating ctag file...");
        exec(command,{cwd:controller._current_path},function(err,stdout,stderr){
            print_info("Ctag generation has benn completed. Loading the tag file low..");
            controller._status = Status.GENERATED;
            controller._load_tags();
        });     
    }
}

function print_error(msg :string){
    window.showErrorMessage(msg);
    console.error(msg);
}

function print_info(msg :string){
    window.showInformationMessage(msg);
    console.log(msg);
}
