const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

const NodeParams = require('./plugins/NodeParams');
const ServerParams = require('./plugins/ServerParams');

const integrateLibs = require('./plugins/LibsIntegration');
integrateLibs();
const getScopedName = require('./plugins/getScopedName');
const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all'
        }
    };
    if(NodeParams.IS_PROD) {
        config.minimizer = [
            new OptimizeCssAssetWebpackPlugin(),
            new TerserWebpackPlugin()
        ];
    }
    if(NodeParams.IS_DEV){
        config.noEmitOnErrors = true;
    }
    return config;
};
const filename = ext => NodeParams.IS_DEV ? `[name].${ext}` : `[name].[hash].${ext}`;
const cssLoaders = extra => {
    let cssLoaderOptions = {
        modules: true,
        sourceMap: false,
        importLoaders: 2,
        camelCase: true,
    };
    if(NodeParams.IS_DEV){
        cssLoaderOptions.localIdentName = '[path][name]__[local]--[hash:base64:5]';
    }
    if(NodeParams.IS_PROD){
        cssLoaderOptions.getLocalIdent = (context, localIdentName, localName) => (
            getScopedName(localName, context.resourcePath)
        );
    }
    const loaders = [
        {
            loader: 'style-loader'
        },
        {
            loader: "css-loader",
            options: cssLoaderOptions,
        },
        {
            loader: "postcss-loader"
        },
    ];
    if (extra) {
        loaders.push(extra);
    }
    return loaders;
};
const babelOptions = preset => {
    const opts = {
        presets: [
            '@babel/preset-env'
        ]
    };
    if (preset) {
        opts.presets.push(preset);
    }
    return opts;
};
const jsLoaders = () => {
    const loaders = [{
        loader: 'babel-loader',
        options: babelOptions('@babel/preset-react')
    }];
    if (NodeParams.IS_DEV) {
        loaders.push('eslint-loader');
    }
    return loaders;
};
const plugins = () => {
    let plugins = [
        new HTMLWebpackPlugin({
            template: './index.html',
            minify: {
                collapseWhitespace: NodeParams.IS_PROD
            }
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns:[
                {
                    from: path.resolve(__dirname, 'styles'),
                    to: path.resolve(__dirname, 'dist/styles')
                },
                {
                    from: path.resolve(__dirname, 'jira_integration.js'),
                    to: path.resolve(__dirname, 'dist')
                },
                {
                    from: path.resolve(__dirname, 'locales'),
                    to: path.resolve(__dirname, 'dist/locales')
                },
                {
                    from: path.resolve(__dirname, 'img'),
                    to: path.resolve(__dirname, 'dist/img')
                }
            ]
        }),
        new MiniCssExtractPlugin({
            filename: filename('css')
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ];
    if(NodeParams.IS_DEV){
        plugins.push(new webpack.EvalSourceMapDevToolPlugin());
    }
    if(NodeParams.HAS_BROWSER_SYNC){
        plugins.push(
            new BrowserSyncPlugin(
                ServerParams.BROWSER_SYNC.MAIN_OPTIONS,
                ServerParams.BROWSER_SYNC.PLUGIN_OPTIONS
            )
        );
    }
    return plugins;
};
const output = () => {
    return {
        publicPath: '/',
        filename: "[name].js"
    };
};

const entry = () => {
    let entry = {
        bundle: []
    };
    if(NodeParams.IS_DEV){
        entry.bundle.push('react-hot-loader/patch');
    }
    entry.bundle.push('./app/index.js');
    return entry;
};

module.exports = {
    mode: 'development',
    entry: entry(),
    output: output(),
    resolve: {
        extensions: ['.js', '.json', '.scss'],
        alias: {
            'assets': path.resolve('./img'),
            '@actions': path.resolve(__dirname, 'app/actions'),
            '@classes': path.resolve(__dirname, 'app/classes'),
            '@components': path.resolve(__dirname, 'app/components'),
            '@basic_components': path.resolve(__dirname, 'app/components/general/basic_components'),
            '@change_component': path.resolve(__dirname, 'app/components/general/change_component'),
            '@loading': path.resolve(__dirname, 'app/components/general/app/Loading'),
            '@decorators': path.resolve(__dirname, 'app/decorators'),
            '@epics': path.resolve(__dirname, 'app/epics'),
            '@themes': path.resolve(__dirname, 'app/themes'),
            '@utils': path.resolve(__dirname, 'app/utils'),
            '@validations': path.resolve(__dirname, 'app/validations')
        },
        modules: ['node_modules', 'oc_modules']
    },
    optimization: optimization(),
    devtool: NodeParams.IS_DEV ? '#cheap-module-source-map' : 'source-map',
    plugins: plugins(),
    node: {
        net: 'empty',
        dns: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: cssLoaders()
            },
            {
                test: /\.s[ac]ss$/,
                use: cssLoaders({
                    loader: "sass-loader",
                    options: {
                        includePaths: ["node_modules"]
                    }
                })
            },
            {
                test: /\.(png|jpe?g|svg|gif)$/,
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
            },
            {
                test: /\.(js|jsx)$/,
                exclude: [/libs/, /node_modules/],
                use: jsLoaders()
            }
        ]
    }
};