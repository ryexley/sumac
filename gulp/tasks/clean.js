var path = require("path");
var gulp = require("gulp");
var del = require("del");
var buildConfig = require("../config");

gulp.task("clean:dist", function (next) {
  del([path.join(buildConfig.buildRoot, "messenger.js")], next);
});

gulp.task("clean:dist:min", function (next) {
  del([path.join(buildConfig.buildRoot, "messenger.min.js"), path.join(buildConfig.buildRoot, "messenger.min.js.map")], next);
});
