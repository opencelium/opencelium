
/*
 * Copyright (C) <2019>  <becon GmbH>
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
const common = require('./webpack.config.js');
const merge = require('webpack-merge');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    entry: {
        bundle: "./app/index.js"
    },
    devtool: "#cheap-module-source-map",
    output: {
        publicPath: '/',
        filename: "[name].js"
    },
    optimization: {
        noEmitOnErrors: true
    },
    plugins: [
        new webpack.DefinePlugin({
            __PRODUCTION__: JSON.stringify(false)
        }),
        new webpack.EvalSourceMapDevToolPlugin(),
        new BrowserSyncPlugin({
            host: 'localhost',
            ghostMode: false,
            codeSync: false,
            port: 8888,
            proxy: {
                target: 'http://localhost:8081/',
                ws: true
            }
        },
        {reload: false})
    ],
    node: {
        net: 'empty',
        dns: 'empty'
    }
});