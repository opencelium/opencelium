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

const NodeParams = require('./NodeParams');

const mainPort = 8888;
const proxyPort = 8081;
const socketPort = 8082;
const webpackDevServerPort = NodeParams.HAS_BROWSER_SYNC ? proxyPort : mainPort;

/**
 * params for opencelium servers
 */
module.exports = {
    WEBPACK_DEV_SERVER: {
        PORT: webpackDevServerPort,
        HOSTNAME: '0.0.0.0',
        OPTIONS: {
            disableHostCheck: true,
            open: NodeParams.IS_DEV && !NodeParams.HAS_BROWSER_SYNC,
            liveReload: false,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            historyApiFallback: true,
            watchContentBase: true
        }
    },
    SOCKET: {
        PORT: socketPort
    },
    BROWSER_SYNC:{
        MAIN_OPTIONS:{
            host: 'localhost',
            ghostMode: true,
            codeSync: true,
            port: mainPort,
            proxy: {
                target: `http://localhost:${proxyPort}/`,
                ws: true
            }
        },
        PLUGIN_OPTIONS: {
            reload: false
        }
    },
    PRODUCTION_SERVER: {
        PORT: 8888
    }
};