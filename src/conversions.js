"use strict";

var types = require('./utils/types');

function checkType(checkKey, value) {
  var check = types[checkKey];

  if (!check(value)) {
    throw new TypeError('Type check failed: ' + checkKey + '(' + JSON.stringify(value) + ')');
  }
}

var Conversions = {
  toJSON: function(value) {
    return JSON.stringify(value);
  },

  Number_To_String: function(value) {
    checkType('isNumber', value);
    return value.toString();
  },

  Number_To_Boolean: function(value) {
    checkType('isNumber', value);
    return !!value;
  },

  Number_To_Date: function(value) {
    checkType('isNumber', value);
    return new Date(value);
  },

  String_To_Integer: function(value) {
    checkType('isString', value);
    return parseInt(value, 10);
  },

  String_To_Number: function(value) {
    checkType('isString', value);
    return parseFloat(value, 10);
  },

  String_To_Date: function(value) {
    checkType('isString', value);
    return new Date(Date.parse(value));
  },

  Date_To_String: function(value) {
    checkType('isDate', value);
    return '' + value;
  },

  Boolean_To_Integer: function(value) {
    checkType('isBoolean', value);
    return +value;
  },
};



module.exports = Conversions;