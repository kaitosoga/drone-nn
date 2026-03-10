const JscramblerWebpack = require('jscrambler-webpack-plugin');

module.exports = {
  plugins: [
    new JscramblerWebpack({
     chunks: ['main']
    })
  ]
};