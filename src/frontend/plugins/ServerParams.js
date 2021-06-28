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
const SETTINGS = require('../settings.json');
const fs = require("fs");

const mainPort = 8888;
const proxyPort = 8081;
const socketPort = 8082;
const webpackDevServerPort = NodeParams.HAS_BROWSER_SYNC ? proxyPort : mainPort;

function getHttpsSettings(){
    let https = false;
    if(SETTINGS.hasOwnProperty('HTTPS')){
        if(typeof SETTINGS.HTTPS === 'boolean'){
            https = SETTINGS.HTTPS;
        } else{
            https = {};
            if(SETTINGS.HTTPS.hasOwnProperty('key')){
                if(fs.existsSync(SETTINGS.HTTPS.key)){
                    https.key = fs.readFileSync(SETTINGS.HTTPS.key);
                } else{
                    console.log('There is no Key file for https connection.')
                }
            } else{
                console.log('There is no Key Parameter for https connection in settings.json file.')
            }
            if(SETTINGS.HTTPS.hasOwnProperty('cert')){
                if(fs.existsSync(SETTINGS.HTTPS.cert)) {
                    https.cert = fs.readFileSync(SETTINGS.HTTPS.cert);
                } else{
                    console.log('There is no Cert file for https connection.')
                }
            } else{
                console.log('There is no Cert Parameter for https connection in settings.json file.')
            }
            if(SETTINGS.HTTPS.hasOwnProperty('ca')){
                if(fs.existsSync(SETTINGS.HTTPS.ca)) {
                    https.ca = fs.readFileSync(SETTINGS.HTTPS.ca);
                } else{
                    console.log('There is no Ca file for https connection.')
                }
            }
            if(!https.hasOwnProperty('key') || !https.hasOwnProperty('cert')){
                https = false;
            }
        }
    }
    return https;
}

/**
 * params for opencelium servers
 */
let https = getHttpsSettings();
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
            watchContentBase: true,
            https,
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