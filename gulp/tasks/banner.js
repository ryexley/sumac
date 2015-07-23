var path = require("path");
var gulp = require("gulp");
var insert = require("gulp-insert");
var packageData = require(path.join(__dirname, "../package.json"));
var _template = require("lodash/string/template");

var bannerTemplate = [
      "// ${packageName}, v${packageVersion} | (c) ${currentYear} Bob Yexley",
      "// Description: ${packageDescription}",
      "// Generated: ${currentDate}",
      "// https://github.com/ryexley/sumac",
      "// License: http://www.opensource.org/licenses/mit-license"
    ].join("\n");

var banner = _template(bannerTemplate);

var data = {
  packageName: packageData.name,
  packageVersion: packageData.version,
  packageDescription: packageData.description,
  currentDate: "",
  currentYear: ""
};
