/*
 *  Copyright (C) <2023>  <becon GmbH>
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

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const fs = require("fs");
const SETTINGS = require('./settings.json');

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
const getConfig = ({isBuild, envVar}) => {
    const copyWebpackPluginSettings = {};
    copyWebpackPluginSettings.patterns = [
        {
            from: path.resolve(__dirname, 'locales'),
            to: path.resolve(__dirname, 'dist/locales')
        },
        {
            from: path.resolve(__dirname, 'src/img'),
            to: path.resolve(__dirname, isBuild ? 'dist/img' : 'dist')
        },
        {
            from: path.resolve(__dirname, 'src/styles/css'),
            to: path.resolve(__dirname, 'dist/styles/css')
        },
        {
            from: path.resolve(__dirname, 'src/styles/fonts'),
            to: path.resolve(__dirname, 'dist/styles/fonts')
        },
    ];
    if(envVar && envVar.hasOwnProperty('process.env.isDevelopment') && envVar['process.env.isDevelopment']){
        copyWebpackPluginSettings.patterns.push(
            {
                from: path.resolve(__dirname, 'src/img/application/fav_icon.png'),
                to: path.resolve(__dirname, 'dist')
            }
        );
    }
    return {
        entry: ['@babel/polyfill', './src/index.jsx'],
        module: {
            rules: [
                /*
                * TODO: remove css loaders (style-loader, css-loader, postcss-loader, sass-loader) when connection will be integrated
                */
                {
                    test: /\.css$/,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                import: true,
                                modules: {
                                    exportLocalsConvention: "camelCase",
                                    auto: (resourcePath) => resourcePath.endsWith("theme.css"),
                                    localIdentName: '[path][name]__[local]--[hash:base64:5]',
                                },
                            }
                        }
                    ]
                },
                {
                    test: /\.s[ac]ss$/,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                importLoaders: 1,
                                import: true,
                                modules: {
                                    exportLocalsConvention: "camelCase",
                                    localIdentName: '[path][name]__[local]--[hash:base64:5]',
                                },
                            }
                        },
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: ["babel-loader"]
                },
                {
                    test: /\.(ts|tsx)?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.(png|jpe?g|svg|gif|woff|woff2)$/,
                    use: [
                        {
                            loader: 'url-loader',
                        }
                    ]
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss'],
            alias: {
                '@entity': path.resolve('./src/entities'),
                '@application': path.resolve('./src/application'),
                '@style': path.resolve('./src/styles'),
                '@image': path.resolve('./src/img'),
                '@app_component': path.resolve(__dirname, './src/components/'),
                '@oc_modules': path.resolve(__dirname, './oc_modules/'),
                /*
                * TODO: remove next alias after connection cleaning
                */
                '@change_component': path.resolve(__dirname, './src/entities/connection/components/components/general/change_component/'),
                '@basic_components': path.resolve(__dirname, './src/entities/connection/components/components/general/basic_components/'),
                '@themes': path.resolve(__dirname, './src/entities/connection/themes/components/'),
                '@list_of_components': path.resolve(__dirname, './src/entities/connection/list_of_components/components/'),
                '@view_component': path.resolve(__dirname, './src/entities/connection/view_component/components/'),
                '@utils': path.resolve(__dirname, './src/entities/connection/components/utils/components/'),
                '@classes': path.resolve(__dirname, './src/entities/connection/components/classes/components/'),
                '@root': path.resolve('./src/entities/connection/'),
                '@actions': path.resolve(__dirname, './src/entities/connection/actions/components'),
                '@components': path.resolve(__dirname, './src/entities/connection/components/components'),
                '@loading': path.resolve(__dirname, './src/entities/connection/components/components/general/app/Loading'),
                '@decorators': path.resolve(__dirname, './src/entities/connection/decorators/components'),
                '@epics': path.resolve(__dirname, './src/entities/connection/epics/components'),
                '@validations': path.resolve(__dirname, './src/entities/connection/validations/components'),
                '@update_assistant': path.resolve(__dirname, './src/entities/update_assistant/components/'),
            },
            modules: ['node_modules', 'oc_modules']
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: isBuild ? 'auto' : '/',
            clean: true,
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'public'),
                publicPath: '/',
            },
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            compress: true,
            port: SETTINGS?.DEV?.PORT || 8888,
            open: true,
            liveReload: true,
            historyApiFallback: true,
            allowedHosts: 'all',
            https: getHttpsSettings(),
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.join(__dirname, "src", "index.html"),
                favicon: path.join(__dirname, "src", "./img/application/fav_icon.png"),
            }),
            new NodePolyfillPlugin(),
            new CopyWebpackPlugin(copyWebpackPluginSettings),
            new webpack.DefinePlugin({...envVar})
        ],
    };
};

//to run in development or in production mode
module.exports.getConfig = getConfig;