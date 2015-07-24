var path = require("path");
var _template = require("lodash/string/template");
var gulp = require("gulp");
var insert = require("gulp-insert");
var buildConfig = require("../config");
var packageData = require(path.join(__dirname, "../../package.json"));
var date = require("./date");

var bannerTemplate = [
      "// ${packageName}, v${packageVersion} | (c) ${currentYear} ${packageAuthor}",
      "// Description: ${packageDescription}",
      "// Built: ${currentDate}",
      "// Homepage: ${packageHomepage}",
      "// License: ${packageLicense} (${licenseUrl})",
    ].join("\n"),
    banner = _template(bannerTemplate + "\n\n"),
    now = date.now(new Date()),
    data = {
      packageAuthor: packageData.author.name || "not available",
      packageName: packageData.name || "not available",
      packageVersion: packageData.version || "not available",
      packageDescription: packageData.description || "not available",
      packageHomepage: packageData.homepage || "not available",
      packageLicense: packageData.license || "not available",
      licenseUrl: "http://www.opensource.org/licenses/mit-license",
      currentDate: now.formatted || "",
      currentYear: now.year || ""
    };

gulp.task("banner", function () {
  var stamp = banner(data);

  gulp.src(path.join(buildConfig.buildRoot, "**/*.js"))
      .pipe(insert.prepend(stamp))
      .pipe(gulp.dest(buildConfig.buildRoot));
});
