
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

const path = require('path');


const integrateLibs = require('./plugins/LibsIntegration');
integrateLibs();

const getScopedName = require('./plugins/getScopedName');

module.exports = {
    resolve: {
        alias: {
            'assets': path.resolve('./img')
        },
        extensions: [".js", ".json", ".scss"]
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: [/libs/, /node_modules/],
                use: {
                    loader: "babel-loader"
                }
            }, {
                test: [/\.scss$/, /\.css$/],
                use: [
                    {
                        loader: 'style-loader'  // creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader",   // translates CSS into CommonJS
                        options: {
                            modules: true,
                            sourceMap: false,
                            importLoaders: 2,
                            camelCase: true,
                            localIdentName: "[path][name]__[local]--[hash:base64:5]",

                            /*getLocalIdent: (context, localIdentName, localName) => (
                                getScopedName(localName, context.resourcePath)
                            )*/
                        }
                    },
                    {
                        loader: "postcss-loader"    // loader for webpack to process CSS with PostCSS
                    },
                    {
                        loader: "sass-loader",  // compiles Sass to CSS, using Node Sass by default
                        options: {
                            includePaths: ["node_modules"]
                        }
                    }
                ],
                exclude: [path.resolve(__dirname, 'node_modules/react-fine-uploader'), path.resolve(__dirname, 'node_modules/styles')]
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name(file) {
                                return '[sha512:hash:base64:7].[ext]';
                            },
                        },
                    },
                    {
                        loader: 'image-webpack-loader'
                    }
                ]
            }
        ]
    }
};
