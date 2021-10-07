const {app, BrowserWindow} = require('electron');/*
const kill  = require('tree-kill');
const fs = require('fs')
const findPidFromPort = require("find-pid-from-port")

function writeLog(message){
    fs.open('logs.txt', 'a', 666, function( e, id ) {
        fs.write( id, `${message}\n`, null, 'utf8', function(){
            fs.close(id, function(){
                console.log('file closed');
            });
        });
    });
}

async function findPid(port){
    try {
        writeLog(`Find PID...`);
        const pids = await findPidFromPort(port)
        if(!isNaN(pids.tcp[0])){
            writeLog(`Found Pid - ${pids.tcp[0]} with Port - ${port}`);
            return `${pids.tcp[0]}`;
        }
        writeLog(`Port ${port} is opened`)
        return null;
    } catch (error) {
        writeLog(`Port ${port} is opened`)
        return null;
    }
}

async function killProcess(port){
    writeLog(`Killing process...`);
    writeLog(`Kill process with port - ${port}`);
    const pid = await findPid(port);
    if(pid){
        kill(parseInt(pid));
        writeLog('The process was killed')
    } else{
        writeLog('No process should be killed')
    }
}
*/
let win;
async function createWindow(){
    win = new BrowserWindow({width: 1024, height: 800, backgroundColor: 'white'});
    win.loadFile('./index.html');
}

app.on('ready', createWindow);
app.on('window-all-closed', async function(){
    win = null;
    app.quit()
});