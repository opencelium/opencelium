const integrateLibs = require('./plugins/LibsIntegration');
integrateLibs();

const {getConfig} = require('./webpack.config');
const config = getConfig({envVar: {'process.env.isProduction': true}});

module.exports = config;