/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const integrateLibs = require('./plugins/LibsIntegration');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const {getConfig} = require('./webpack.config');
const config = getConfig({envVar: {'process.env.isDevelopment': true}});
integrateLibs();
const compiler = webpack({
    ...config,
    mode: 'development',
    devtool: 'eval-source-map',
});
const server = new WebpackDevServer({...config.devServer}, compiler);
server.startCallback(() => {
    console.log("Starting client...");
});

