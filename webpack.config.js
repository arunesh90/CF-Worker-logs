const webpack = require('webpack')

require('dotenv').config({
  path: './.env'
})

module.exports = {
  target : 'webworker',
  entry  : './src/main.ts',
  mode   : 'production',
  module : {
    rules: [
      {
        test   : /\.tsx?$/,
        use    : 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ELASTIC_URL'     : `'${process.env.ELASTIC_URL}'`,
      'process.env.ELASTIC_INDEX'   : `'${process.env.ELASTIC_INDEX}'`,
      'process.env.ELASTIC_USERNAME': `'${process.env.ELASTIC_USERNAME}'`,
      'process.env.ELASTIC_PASSWORD': `'${process.env.ELASTIC_PASSWORD}'`,
      'process.env.BATCH_INTERVAL'  : `'${process.env.BATCH_INTERVAL}'`
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path      : __dirname + '/dist',
    publicPath: 'dist',
    filename  : 'worker.js'
  }
}
