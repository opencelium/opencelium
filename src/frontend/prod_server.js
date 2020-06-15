const path = require('path');
const Server = require('./plugins/ServerIntegration');

Server.SOCKET_SERVER.run();
Server.PROD_SERVER.run({indexPath:  path.join(__dirname+'/dist/index.html'), distPath: path.join(__dirname, 'dist')});