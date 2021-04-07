/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const express = require('express');
const webpack = require('webpack');
const config = require('../webpack.config');
const compiler = webpack(config);
const WebpackDevServer = require('webpack-dev-server');

const ServerParams = require('./ServerParams');

function runWebpackDevServer(){
    const server = new WebpackDevServer(compiler, ServerParams.WEBPACK_DEV_SERVER.OPTIONS);
    server.listen(ServerParams.WEBPACK_DEV_SERVER.PORT, ServerParams.WEBPACK_DEV_SERVER.HOSTNAME, function (err, result) {
        if (err) {
            return console.log(err);
        }
    });
    console.log('OpenCelium App is running on port ' + ServerParams.WEBPACK_DEV_SERVER.PORT);
}

function runSocketServer(){
    const io = require('socket.io')();
    const socketNames = ['add.user', 'update.user', 'update.userdetail', 'delete.user', 'add.permission'];
    io.on('connection', socketConnection);
    function socketConnection(socket) {
        socketNames.forEach(function (elem) {
            socket.on(elem, (data) => {
                socket.broadcast.emit(elem, data);
            });
        });
    }
    io.listen(ServerParams.SOCKET.PORT);
    console.log('Sockets for OpenCelium App is running on port ' + ServerParams.SOCKET.PORT);
}

function runExpressServer({indexPath, distPath}){
    const app = express();
    app.use(express.static(distPath));
    app.get('*', (req,res) =>{
        res.sendFile(indexPath);
    });
    app.listen(ServerParams.PRODUCTION_SERVER.PORT);
    console.log('OpenCelium App is running on port ' + ServerParams.PRODUCTION_SERVER.PORT);
}

module.exports = {
    SOCKET_SERVER: {
        run: runSocketServer,
    },
    DEV_SERVER: {
        run: runWebpackDevServer,
    },
    PROD_SERVER: {
        run: runExpressServer,
    }
};