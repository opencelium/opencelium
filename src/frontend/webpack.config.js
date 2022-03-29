const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const integrateLibs = require('./plugins/LibsIntegration');
integrateLibs();

module.exports = {
    mode: 'development',
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
                            importLoaders: 2,
                            import: true,
                            modules: {
                                exportLocalsConvention: "camelCase",
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
                            importLoaders: 2,
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
            '@images': path.resolve('./src/img'),
            '@request': path.resolve(__dirname, './src/requests/classes/'),
            '@requestInterface': path.resolve(__dirname, './src/requests/interfaces/'),
            '@class': path.resolve(__dirname, './src/classes/'),
            '@collection': path.resolve(__dirname, './src/collections/'),
            '@interface': path.resolve(__dirname, './src/interfaces/'),
            '@atom': path.resolve(__dirname, './src/components/atoms/'),
            '@molecule': path.resolve(__dirname, './src/components/molecules/'),
            '@organism': path.resolve(__dirname, './src/components/organisms/'),
            '@page': path.resolve(__dirname, './src/components/pages/'),
            '@template': path.resolve(__dirname, './src/components/templates/'),
            '@action': path.resolve(__dirname, './src/store/action_creators/'),
            '@store': path.resolve(__dirname, './src/store/'),
            '@constants': path.resolve(__dirname, './src/constants/'),
            '@translations': path.resolve(__dirname, './src/translations/'),
            '@slice': path.resolve(__dirname, './src/store/reducers/'),
            '@oc_modules': path.resolve(__dirname, './oc_modules/'),
            /*
            * TODO: remove next alias after connection cleaning
            */
            '@change_component': path.resolve(__dirname, './src/components/connection/components/general/change_component/'),
            '@basic_components': path.resolve(__dirname, './src/components/connection/components/general/basic_components/'),
            '@themes': path.resolve(__dirname, './src/components/connection/themes/'),
            '@list_of_components': path.resolve(__dirname, './src/components/connection/list_of_components/'),
            '@view_component': path.resolve(__dirname, './src/components/connection/view_component/'),
            '@utils': path.resolve(__dirname, './src/components/connection/utils/'),
            '@classes': path.resolve(__dirname, './src/components/connection/classes/'),
            '@root': path.resolve('./src/components/connection/'),
            '@actions': path.resolve(__dirname, './src/components/connection/actions'),
            '@components': path.resolve(__dirname, './src/components/connection/components'),
            '@loading': path.resolve(__dirname, './src/components/connection/components/general/app/Loading'),
            '@decorators': path.resolve(__dirname, './src/components/connection/decorators'),
            '@epics': path.resolve(__dirname, './src/components/connection/epics'),
            '@validations': path.resolve(__dirname, './src/components/connection/validations'),
            '@update_assistant': path.resolve(__dirname, './src/components/update_assistant/'),
        },
        modules: ['node_modules', 'oc_modules']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
            publicPath: '/',
        },
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        compress: true,
        port: 8888,
        open: true,
        liveReload: true,
        historyApiFallback: true,
        allowedHosts: 'all',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            favicon: path.join(__dirname, "src", "img/fav_icon.png"),
        }),
        new NodePolyfillPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'locales'),
                    to: path.resolve(__dirname, 'dist/locales')
                },
            ]
        }),
    ],
};