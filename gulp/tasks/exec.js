var gulp = require("gulp");
var run = require("child_process").spawn;

gulp.task("test", ["webpack"], function (next) {
  run("npm", ["test", "-s"], { stdio: "inherit" }).on("exit", function (err) {
    next(err);
  });
});
