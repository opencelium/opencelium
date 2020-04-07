/*
 * Copyright (C) <2020>  <becon GmbH>
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

const webpack = require('webpack');
const config = require('./webpack.config.development');
const compiler = webpack(config);
const WebpackDevServer = require('webpack-dev-server');

const webpackDevServerPort = 8081;
const socketPort = 8082;

//server
const server = new WebpackDevServer(compiler, {
    hot: true,
    inline: false,
    publicPath: config.output.publicPath,
    headers: { "Access-Control-Allow-Origin": "*" },
    historyApiFallback: true,
    watchContentBase: true
});

//socket
const io = require('socket.io')();
const socketNames = ['add.user', 'update.user', 'update.userdetail', 'delete.user', 'add.permission'];
io.on('connection', newConnection);
function newConnection(socket){
    socketNames.forEach(function(elem){
        socket.on(elem, (data) => {
            console.log(elem);
            console.log(data);
            socket.broadcast.emit(elem, data);
        });
    });
}
io.listen(socketPort);

//listen server
server.listen(webpackDevServerPort, '0.0.0.0', function (err, result) {
  if (err) {
    return console.log(err);
  }
});