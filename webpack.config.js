const path = require("path");
const webpack = require("webpack");
const packageManifest = require("./package.json"); // Fixed typo: "./package" -> "./package.json"
const FileManagerPlugin = require("filemanager-webpack-plugin");

const OUTPUT_FOLDER = path.resolve(__dirname, "dist"); // Use path.resolve for better cross-platform compatibility

module.exports = {
  output: {
    path: OUTPUT_FOLDER,
    filename: "singular-sdk.js",
    libraryTarget: "umd",
    globalObject: "this", // Ensures UMD works in both browser and Node.js environments
  },
  entry: ["./src/index.js"],
  // devtool: 'eval-source-map', // Uncommented for dev, consider 'source-map' for production
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            // Optional: Inline Babel config (or rely on .babelrc/babel.config.js)
            presets: ["@babel/preset-env"],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-private-methods",
              "@babel/plugin-transform-async-to-generator",
              "@babel/plugin-transform-runtime",
              "@babel/plugin-transform-strict-mode",
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      SDK_VERSION: JSON.stringify(packageManifest.version),
      SDK_ENDPOINT: JSON.stringify("https://sdk-api-v1.singular.net/api/v1/"),
    }),
    new FileManagerPlugin({
      events: {
        // Updated syntax for newer filemanager-webpack-plugin versions
        onEnd: {
          copy: [
            {
              source: `${OUTPUT_FOLDER}/singular-sdk.js`, // Be specific about the file
              destination: path.resolve(
                __dirname,
                "../web-sdk-app/singular-sdk-app/singular-sdk.js" // Specify full destination path
              ),
            },
          ],
        },
      },
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx"], // Ensure .jsx files are resolved
  },
};
