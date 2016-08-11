# VScode-Ctags 
## This is the [Visual Studio Code](https://code.visualstudio.com/) extension to use [CTAGS](http://ctags.sourceforge.net/) 

### Prerequisites:
* OS : Windows (Test OK) / Linux / OSX
* [CTAGS](http://ctags.sourceforge.net/)

### Howto:
* Install ctag and the path of 'ctag' command 'MUST' be in your 'PATH' environment variable. 
* Open a source code directory using 'Open Folder'
* Generate the ctag file using 'CTAGS:Generate' command. (Press 'F1' key and type 'CTAGS:Generate')
* After the ctag file is generated, search the symbol using 'CTAGS:Search' command. (Press 'F1' key and type 'CTAGS:Search');


### Etc
* Source : [github](https://github.com/hcyang1012/vscode_ctags)

### Release Note
* 2016.03.06 0.1.0 : First release
* 2016.04.02 0.2.0 : Update None-Generate-Load state sequence.
* 2016.04.03 0.2.2 : Change ctag file caching method: use event-stream rather than line-by-line reading. 
* 2016.04.04 0.2.3 : A little bit refactoring worked. Large file support(>=10MB) is disabled.
* 2016.04.06 0.2.4 : Update large file limit (10MB->50MB). (Temporary)
* 2016.06.05 0.2.5 : Fix minor bugs..
* 2016.06.05 0.2.6 : Fix minor bugs..


** Enjoy! **
