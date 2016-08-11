'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Selection, Position, DecorationRenderOptions, Range, Diagnostic, workspace, window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as CTAG_Manager from "./ctag_manager";
import * as notification from './notification';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ctags" is now active!');
    let extension = new Extension(context);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
    
   
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for C source codes
        documentSelector: ['C'],
    }   

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



class Extension{
    private ctag_manager : CTAG_Manager.CTAG_Manager;
    
    constructor(context : vscode.ExtensionContext){
        let disposable = vscode.commands.registerCommand('extension.ctag_generate', ()=>{
            this.generate_tag(); 
        });
        context.subscriptions.push(disposable);
        
        disposable = vscode.commands.registerCommand('extension.ctag_search', ()=>{
            this.search(); 
        });
        context.subscriptions.push(disposable); 
        
        this.ctag_manager = new CTAG_Manager.CTAG_Manager();
        console.log("CTag Extension has been initialized");    
    }
    public search(){
        let parent:Extension = this;
        vscode.window.showInputBox("Input the symbol name").then(function(targetSymbol){                    
            parent.ctag_manager.search(targetSymbol, function(msg){
                notification.print_info(msg);
            });             
        });
    }
    public generate_tag(){
        this.ctag_manager.generate_tag();   
    }
}

