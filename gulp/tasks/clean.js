var path = require("path");
var gulp = require("gulp");
var del = require("del");
var buildConfig = require("../config");

gulp.task("clean:dist", function (next) {
  del([buildConfig.buildRoot], next);
});
