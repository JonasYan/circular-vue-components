const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const CircularVueComponentsPlugin = require('../index.js')
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './example/main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },
  stats: {
    children: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new CircularVueComponentsPlugin()
  ]
}