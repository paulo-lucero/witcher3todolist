const path = require('path');
const srcPath = path.resolve(__dirname, 'W3gWsApp', 'src-js');

module.exports = {
  mode: 'development',
  entry: [path.resolve(srcPath, 'w3init.js'), path.resolve(srcPath, 'w3gtest.js')],
  output: {
    filename: 'w3main.js',
    path: path.resolve(__dirname, 'W3gWsApp', 'static')
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components|__pycache__|\.venv|devt|tests)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  target: ['web', 'es5']
};
