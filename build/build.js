!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.mutate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  Mutators = require('./utils/mutators');


function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function parse(key, value, rule) {

  if (rule.fields.hasOwnProperty(key)){
    var field = rule.fields[key];

    if (value === undefined && field.hasOwnProperty('def')) {
      value = field.def();
    }

    if (field.hasOwnProperty('encode')) {
      value = field.encode(value);
    }

    if (field.hasOwnProperty('rename')) {
      key = field.rename;
    }
  }

  return {
    key: key,
    value: value
  };
}

function clone(obj) {

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    var copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}



function resolve(origin, rule) {

  var obj = clone(origin);

  var keys;
  if (rule.type == 'select'){
    keys = Object.keys(rule.fields);
  } else {
    keys = Object.keys(obj)
      .concat(Object.keys(rule.fields))
      .filter(unique);
  }

  for (var i = 0, size = rule.remove.length; i < size; i++){
    Mutators.remove(obj, rule.remove[i]);
  }

  var transformed = {};
  for (i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];

      var value = Mutators.get(obj, key, rule),
        param = parse(key, value, rule);

      if (key != param.key) {
        Mutators.remove(transformed, key);
      }

      Mutators.insert(transformed, param.key, param.value);
  }


  return transformed;
}

function isValid(rule){
  return !rule.hasOwnProperty('fields')
    || !rule.hasOwnProperty('exclude')
    || !['select', 'transform'].hasOwnProperty(rule.type);
}

function fillDefaults(rule){
  if (!rule.hasOwnProperty('remove')){
    rule.remove = [];
  }

  if (!rule.hasOwnProperty('type')){
    rule.type = 'transform';
  }

  if (!rule.hasOwnProperty('fields')) {
    rule.fields = {};
  }
}


module.exports = function transform(obj, rule){

    if (!isObject(obj) || !isValid(rule)){
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);

    var params;

    if (isArray(obj)){
      var transformed = [];

      for (var i = 0, size = obj.length; i < size; i++){
        transformed.push(
          resolve(obj[i], rule)
        );
      }

      if (rule.hasOwnProperty('map')){
        params = Mutators.map(transformed, rule.map);
      } else {
        params = transformed;
      }
    } else {
      params = resolve(obj, rule);
    }

    return params;
};
},{"./utils/mutators":2,"./utils/types":3}],2:[function(require,module,exports){
'use strict';
var isArray = require('./types').isArray,
  isObject = require('./types').isObject,
  re = /(\w+)|(\[\d+\])/g;

module.exports = {

  getPart: function getPart(key){
    var sliced = key.slice(1).slice(0, -1);

    if (key[0] == '[' && key[key.length - 1] == ']' && sliced % 1 == 0){
      key = sliced;
    }

    return key;
  },

  get: function get(obj, path){
    var parts = path.match(re),
      current = obj;

    for (var i = 0, size = parts.length; i < size; ++i) {
      var part = this.getPart(parts[i]);

      if(current[part] === undefined) {
        return undefined;
      } else {
        current = current[part];
      }
    }

    return current;
  },

  insert: function insert(obj, key, value){
    var parts = key.match(/(\w+)|(\[\d+\])/g);

    for (var i = 0, size = parts.length; i < size - 1; i++) {
      var part = this.getPart(parts[i]),
        next,
        isArray;

      if (size - 1 != 0){
        next = this.getPart(parts[i + 1]);
        isArray = next % 1 == 0;
      }

      if (obj[part] === undefined){
        obj[part] = isArray ? [] : {};
      }

      obj = obj[part];
    }

    obj[this.getPart(parts[parts.length - 1])] = value;
  },

  remove: function remove(obj, path){

    var parts = path.match(re),
      last = this.getPart(parts.pop()),
      isExist = true;

    for (var i = 0, size = parts.length; i < size; i++){
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (obj[part] != undefined) {
          obj = obj[part];
        } else {
          isExist = false;
        }
      } else {
        isExist = false;
      }
    }

    if (isExist){
      if (last % 1 == 0){
        obj.splice(last, 1);
      } else {
        delete obj[last];
      }
    }
  },

  map: function map(data, field){
    if (!isArray(data) && field){
      throw new Error('Map is available only for arrays');
    }

    var mapped = {};

    for (var i = 0, size = data.length; i < size; i++){
      if (!data[i].hasOwnProperty(field)){
        throw new Error('Map field does not exist in the object');
      }

      mapped[data[i][field]] = data[i];
    }

    return mapped;
  }
};
},{"./types":3}],3:[function(require,module,exports){
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
},{}]},{},[1])(1)
});