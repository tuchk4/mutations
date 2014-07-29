"use strict";

var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

var toString = Object.prototype.toString;
var arrayClass = '[object Array]';


module.exports = {
  isObject: function(value){
    return !!(value && objectTypes[typeof value]);
  },

  isArray: function(value) {
    return value && typeof value == 'object' && typeof value.length == 'number' &&
      toString.call(value) == arrayClass || false;
  }
};