/* based on https://github.com/erickzhao/static-html-webpack-boilerplate, Copyright (c) 2018 Erick Zhao, MIT License */

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

const devHost = process.env.HOST || 'localhost';
const devPort = process.env.PORT || 9000;

module.exports = merge(common, {
  mode: 'development',
  entry: [
    `webpack-dev-server/client?http://${devHost}:${devPort}`
  ],
  devServer: {
    liveReload: true,
    contentBase: path.resolve(__dirname, 'src'),
    watchContentBase: true,
    open: true,
    port: devPort,
    host: devHost,
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [ /* new webpack.HotModuleReplacementPlugin() */ ],
});
