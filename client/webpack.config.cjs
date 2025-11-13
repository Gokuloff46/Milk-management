const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // Fix for React Router subroutes
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Transpile .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/i, // Handle image files
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Resolve these extensions
    alias: {
      'process/browser': require.resolve('process/browser'),
    },
    fallback: {
      process: require.resolve('process/browser'),
      vm: require.resolve('vm-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      util: require.resolve('util/'),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    host: '0.0.0.0', // ← ADDED: Essential for Docker
    allowedHosts: 'all', // ← ADDED: Allow all hosts in Docker
    historyApiFallback: {
      disableDotRule: true, // ← IMPROVED: Better routing support
    },
    open: false, // ← CHANGED: Disable auto-open in Docker
    hot: true,
    client: {
      logging: 'info', // ← ADDED: Better logging
      overlay: {
        errors: true,
        warnings: false,
      }, // ← ADDED: Better error display
    },
    devMiddleware: {
      publicPath: '/', // ← ADDED: Explicit public path
      writeToDisk: false, // ← ADDED: Don't write to disk in dev
    },
    webSocketServer: 'ws',
  },
  mode: process.env.NODE_ENV || 'development', // ← IMPROVED: Use env variable
  plugins: [
    new webpack.DefinePlugin({
      'process.version': JSON.stringify('v16.0.0'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:5000'), // ← ADDED: For API calls
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true, // ← ADDED: Explicit injection
    }),
    new webpack.HotModuleReplacementPlugin(), // ← ADDED: Explicit HMR
  ],
  // ← ADDED: Better development experience
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
  // ← ADDED: Performance hints
  performance: {
    hints: false,
  },
  
  // ← ADDED: Watch options for Docker
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000, // ← IMPORTANT: Enable polling for Docker volume mounts
    ignored: /node_modules/,
  },
};