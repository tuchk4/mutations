!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.transform=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var Utils = require('./utils/include'),
  Types = {
    select: require('./types/select'),
    transform: require('./types/transform')
  };

function isExcluded(key, rule){
  return rule.exclude.indexOf(key) != -1;
}

function selectParam(key, value, rule) {

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

function insert(object, key, value){
  var parts = key.split('.'),
    last = parts.pop();


  for (var i = 0, size = parts.length; i < size; i++){
    if (object[parts[i]] === undefined){
      object[parts[i]] = {};
    }

    object = object[parts[i]];
  }

  if (!Utils.types.isObject(object)){
    throw new Error('Invalid rename property or last obj element is not Array');
  }


  object[last] = value;
}

function resolve(object, rule) {
  var resolver = Types[rule.type];

  var transformed = {};
  for (var key in object){
    if (object.hasOwnProperty(key) && !resolver.isExcluded(key, rule) && !isExcluded(key, rule)){
      var param = selectParam(key, object[key], rule);

      insert(transformed, param.key, param.value);
    }
  }

  return transformed;
}

function isValid(rule){
  return !rule.hasOwnProperty('type')
    || !rule.hasOwnProperty('fields')
    || !rule.hasOwnProperty('exclude')
    || !Types.hasOwnProperty(rule.type);
}

function fillDefaults(rule){
  if (!rule.hasOwnProperty('exclude')){
    rule.exclude = [];
  }

  if (!rule.hasOwnProperty('type')){
    rule.type = 'transform';
  }

  if (!rule.hasOwnProperty('fields')){
    rule.fields = {};
  }
}


module.exports = function transform(object, rule){

    if (!Utils.types.isObject(object) || !isValid(rule)){
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);

    var params = [];

    if (Utils.types.isArray(object)){
      for (var i = 0, size = object.length; i < size; i++){
        var transformed = resolve(object[i], rule);
        params.push(transformed);
      }
    } else {
      params = resolve(object, rule);
    }

    return params;
};
},{"./types/select":2,"./types/transform":3,"./utils/include":4}],2:[function(require,module,exports){
"use strict";

module.exports = {
  isExcluded: function (key, rule){
    return !rule.fields.hasOwnProperty(key);
  }
};
},{}],3:[function(require,module,exports){
"use strict";

module.exports = {
  isExcluded: function (key, rule){
    return false;
  }
};
},{}],4:[function(require,module,exports){
"use strict";

module.exports = {
  types: require('./types')
};
},{"./types":5}],5:[function(require,module,exports){
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