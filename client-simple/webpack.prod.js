const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CompressionPlugin = require('compression-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new HTMLInlineCSSWebpackPlugin(),
    new CompressionPlugin(),
  ],
});
