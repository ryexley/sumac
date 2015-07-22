var path = require("path");
var gulp = require("gulp");
var gulpUtil = require("gulp-util");
var webpack = require("webpack");
var buildConfig = require("../config");

var config = {
  entry: {
    "messenger": path.resolve(buildConfig.sourceRoot, "messenger.js")
  },
  output: {
    path: buildConfig.buildRoot,
    filename: "[name].js",
    libraryTarget: "umd",
    library: "sumac"
  },
  plugins: [],
  resolve: ["", ".js"],
  module: {
    loaders: [
      { test: /\.(js)$/, loader: "babel", include: buildConfig.sourceRoot }
    ]
  }
};

gulp.task("webpack", ["clean:dist"], function (next) {
  webpack(config, function (err, stats) {
    if (err) {
      throw new gulpUtil.PluginError("webpack", err);
    }

    gulpUtil.log("[webpack]\n\n", stats.toString({
      colors: true,
      hash: false,
      version: true,
      timings: true,
      chunks: true,
      chunkModules: false,
      cached: true,
      cachedAssets: true
    }), "\n");

    next();
  });
});
