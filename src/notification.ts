'use strict';
import * as vscode from 'vscode';
import {Selection, Position, DecorationRenderOptions, Range, Diagnostic, workspace, window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

 
export function print_error(msg :string){
    window.showErrorMessage(msg);
    console.error(msg);
}
export function print_info(msg :string){
    window.showInformationMessage(msg);
    console.log(msg);
}    
