const HtmlWebPackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

// webpack.config.js
const webpack = require('webpack')
const dotenv = require('dotenv')

// this will update the process.env with environment variables in .env file
dotenv.config();

const deps = require("./package.json").dependencies;

module.exports = (_, argv) => ({
  output: {
    publicPath: "http://localhost:8069/",
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },

  devServer: {
    port: 8069,
    historyApiFallback: true,
  },

  module: {
    rules: [
      {
        test: /\.json$/,
        loader: 'json-loader',
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(css|s[ac]ss)$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.svg$/,
        use: ['file-loader'],
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
    }),
    new ModuleFederationPlugin({
      name: "fe_map",
      filename: "remoteEntry.js",
      remotes: {
        fe_user_list: "fe_user_list@http://localhost:8082/remoteEntry.js",
        fe_common_tools: "fe_common_tools@http://localhost:8070/remoteEntry.js",
      },
      exposes: {
        './ViewPeta': './src/components/Peta.jsx',
      },
      shared: {
        ...deps,
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: deps["react-dom"],
        },
      },
    }),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
    }),
  ],
});
