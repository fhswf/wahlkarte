/* based on https://github.com/erickzhao/static-html-webpack-boilerplate, Copyright (c) 2018 Erick Zhao, MIT License */

const glob = require('glob');
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');

// const generateHTMLPlugins = () => glob.sync('./src/**/*.html').map(
//   dir => new HTMLWebpackPlugin({
//     filename: path.basename(dir), // Output
//     template: dir, // Input
//      lang: 'de',
//     title: 'Wahlergebniskarte'
//   }),
// );

module.exports = {
  resolve: {
    fallback: {
        fs: false,
    }
  },
  entry: ['./src/js/app.js', './src/style/main.scss'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.[contenthash].js',
    publicPath: '',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
      {
        test: /\.html$/,
        loader: 'raw-loader',
      },
      {
        test: /\.(pdf|gif|png|jpe?g|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'static/',
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        }],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/static/', to: './static/' },
        { from: './src/data/', to: './data/' },
      ],
    }),
    // ...generateHTMLPlugins(),
    new HTMLWebpackPlugin({
        filename: 'index.html', // Output
        template: 'src/index-template.ejs', // Input
        lang: 'de',
        title: 'Wahlergebniskarte'
    }),
  ],
  stats: {
    colors: true,
  },
  devtool: 'source-map',
};
