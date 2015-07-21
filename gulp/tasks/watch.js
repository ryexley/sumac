var path = require("path");
var gulp = require("gulp");
var buildConfig = require("../config");

gulp.task("watch", function () {

  gulp.watch(path.resolve(buildConfig.sourceRoot, "**/*.js"), ["webpack"]);

});
