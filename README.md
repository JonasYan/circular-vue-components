# circular-vue-components

**A webpack plugin that detect circular components in vue project**

````JavaScript
// webpack.config.js
const CircularVueComponentsPlugin = require('circular-vue-components')

module.exports = {
  entry: './src/main.js',
  plugins: [
    new CircularVueComponentsPlugin()
  ],
};
````

