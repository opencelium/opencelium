const {app, BrowserWindow} = require('electron');
const kill  = require('tree-kill');
const fs = require('fs')

function writeLog(message){
    fs.writeFile('logs.txt', message, function (err,data) {
        if (err) {
            return console.log(err);
        }
        console.log(data);
    });
}

let javaProcess;
let neo4jProcess;
function createWindow(){
    function runJava(callback){
        const exec = require('child_process').exec;
        javaProcess = exec(`cd ../../../backend && java -jar -Dserver.port=9090 build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar`, callback);
    }
    function runNeo4j(callback){
        const exec = require('child_process').exec;
        neo4jProcess = exec('neo4j console', callback);
    }
    let win = new BrowserWindow({width: 1024, height: 800, backgroundColor: 'white'});
    win.loadFile('./loading.html');


    runNeo4j(function(error, stdout, stderr){
        writeLog('stdout: ' + stdout);
        writeLog('stderr: ' + stderr);
        if(error !== null){
            writeLog('exec error: ' + error);
        }
        runJava(
            function (error, stdout, stderr){
                writeLog('stdout: ' + stdout);
                writeLog('stderr: ' + stderr);
                if(error !== null){
                    writeLog('exec error: ' + error);
                }
                win.loadFile('./index.html');
            }
        );
    });


    /*
    const serverChild = require('child_process').spawn(
        'java', ['-jar', '../../backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT','-port', '9090']
    );
    serverChild.stdout.on('data', (data) => {
        writeLog(`stdout: ${data}`);
    });
    serverChild.stderr.on('data', function (data){
        writeLog(data);
    });
    serverChild.on('error', (error) => writeLog(`error: ${error.message}`))
    win.on('closed', function () {
        kill(serverChild.pid);
        win = null
    })*/
}

app.on('ready', createWindow);