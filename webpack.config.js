var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        publicPath: '/assets/',
        filename: 'main.bundle.js'
    },
    node: {
        fs: 'empty'
    },
    module: {
        loaders: [
			// {
			// 	test: /\.json$/,
			// 	include: path.join(__dirname, 'node_modules', 'pixi.js'),
			// 	loader: 'json',
			// },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};