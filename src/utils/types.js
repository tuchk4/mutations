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

var isObject = function(value){
  return !!(value && objectTypes[typeof value]);
};

var isArray = function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == arrayClass || false;
};

var isString = function(value) {
  return typeof value === 'string';
};

var isNumber = function(value) {
  return typeof value === 'number';
};

var isBoolean = function(value){
  return value === true || value === false;
};

var exist = function(value){
  var exist = false;
  if (value instanceof Date){
    exist = true;
  } else if (isArray(value)){
    exist = !!value.length;
  } else if (isObject(value)){
    for (var i in value){
      if (value.hasOwnProperty(i)){
        exist = true;
        break;
      }
    }
  } else if (isString(value)) {
    exist = !!value.length;
  } else if (isNumber(value)){
    exist = true;
  } else if (isBoolean(value)){
    exist = true;
  } else if (value === null){
    exist = true;
  }

  return exist;
};


module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  isNumber: isNumber,
  exist: exist
};