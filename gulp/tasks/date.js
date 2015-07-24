var _template = require("lodash/string/template");
var _extend = require("lodash/object/assign");

module.exports = {

  milliseconds: function (date) {
    date = date || new Date();
    return date.getMilliseconds();
  },

  seconds: function (date) {
    date = date || new Date();
    return date.getSeconds();
  },

  minutes: function (date) {
    date = date || new Date();
    return date.getMinutes();
  },

  hour: function (date) {
    date = date || new Date();
    return date.getHours();
  },

  day: function (date) {
    date = date || new Date();
    return date.getDate();
  },

  month: function (date) {
    date = date || new Date();

    var month = date.getMonth(),
        months = [
          "January", "February", "March",
          "April", "May", "June",
          "July", "August", "September",
          "October", "November", "December"
        ];

    return {
      number: (month + 1),
      name: months[month]
    };
  },

  year: function (date) {
    date = date || new Date();
    return date.getFullYear();
  },

  now: function (date) {
    date = date || new Date();

    var now,
        month = this.month(date),
        template = _template("${monthName} ${day}, ${year} ${hour}:${minutes}:${seconds}.${ms}"),
        data = {
          ms: this.milliseconds(date),
          seconds: this.seconds(date),
          minutes: this.minutes(date),
          hour: this.hour(date),
          day: this.day(date),
          monthNumber: month.number,
          monthName: month.name,
          year: this.year(date)
        };

    now = _extend({}, data, {
      formatted: template(data)
    });

    return now;
  }

};
