const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src/index.ts"),
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "./static/dist")
  },

  mode: process.env.NODE_ENV || "development",

  watchOptions: {
    ignored: /node_modules|dist|\.js/g
  },

  resolve: {
    extensions: [".ts", ".js", ".json"],
    plugins: []
  },

  module: {
    rules: [
      {
        test: /\.worker.ts$/,
        use: {
          loader: "worker-loader",
          options: { inline: false, publicPath: "dist/" }
        }
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: "/node_modules"
      }
    ]
  }
};
