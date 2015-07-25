var gulp = require("gulp");

gulp.task("default", ["dev"]);
gulp.task("dev", ["watch"]); // alias
gulp.task("build", ["webpack", "webpack:min"], function () {
  gulp.start("banner");
});
