'use strict';

export function test_file_size(file_path : string, max_size:number){
    let fs = require("fs");
    try{
        let stat_result = fs.statSync(file_path);
        if(stat_result.size < max_size){
            return true;
        }
    }catch(e){
        return false;
    }
    return false;
}

export function file_exists(file_path : string) : boolean{
    let fs = require("fs");
    try{
        fs.accessSync(file_path, fs.R_OK);
    }catch(e){
        return false;
    }
    return true;
}

export function parse_file_line(file_path : string, parse : (line:string)=>void, error : () => void, success  : () => void){
        let fs = require('fs')
        let es = require('event-stream');
                
        let stream = fs.createReadStream(file_path).pipe(es.split()).pipe(
            es.mapSync(function(line){
                stream.pause();
                
                parse(line);               
                
                stream.resume();    
            }).on('error',function(){
                error();
            }).on('end',function(){
                success();
            })
        );    
}