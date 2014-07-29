"use strict";

module.exports = {
  isExcluded: function (key, rule){
    return !rule.fields.hasOwnProperty(key);
  }
};