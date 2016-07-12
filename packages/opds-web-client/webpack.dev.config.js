var webpack = require('webpack');

var config = {
  entry: {
    app: [
      'webpack/hot/dev-server',
      './src/app.tsx',
    ],
  },
  output: {
    filename: 'opds-web-client.js',
    publicPath: 'http://localhost:8090/dist',
    library: 'OPDSWebClient',
    libraryTarget: 'umd'
  },
  devtool: 'eval',
  plugins: [
    new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV) }),
    // jsdom is needed for server rendering, but causes errors
    // in the browser even if it is never used, so we ignore it:
    new webpack.IgnorePlugin(/jsdom$/)
  ],
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loaders: [
          'react-hot',
          'ts-loader'
        ]
      },
      {
        test: /\.json$/,
        loaders: ['json-loader']
      }
    ],
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js", ".ts", ".tsx"]
  }
};

module.exports = config;