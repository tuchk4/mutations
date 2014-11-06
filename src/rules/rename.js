'use strict';

var isObject = require('../utils/types').isObject,
  isArray = require('../utils/types').isArray,
  isFunction = require('../utils/types').isFunction;

var methods = {
  uppercase: function (key) {
    return key.toUpperCase();
  },

  lowercase: function (key) {
    return key.toLowerCase();
  },

  // TODO: add support for symbols ! @ $ % etc.
  toCamelCase: function(key){
    return key.replace(/(\_[a-z])/g, function($1){
      return $1.toUpperCase().replace('_','');
    });
  },

  // TODO: add support for symbols ! @ $ % etc.
  toSnakeCase: function(key){
    return key.replace(/([A-Z])/g, function($1){
      return "_"+$1.toLowerCase();
    });
  }
};


function renameObject(method, origin) {
  var transformed = {};

  for (var attr in origin) {
    if (origin.hasOwnProperty(attr)) {

      var rename = method(attr);

      if (isObject(origin[attr]) && !isArray(origin[attr])) {
        transformed[rename] = renameObject(method, origin[attr]);
      } else {
        transformed[rename] = origin[attr];
      }
    }
  }

  return transformed;
}


module.exports = {
  exports: {
    addRenameMethod: function (key, method) {
      if (methods.hasOwnProperty(key)) {
        console.log('Notice: Rename method already exist');
      }
      methods[key] = method;
    }
  },

  run: function (key, value, config, origin, transformed) {

    console.log(key);
    /**
     * If not root element
     */
    if (key !== undefined) {
      var rename;

      if (isFunction(config)){
        rename = config(key);
      } else {
        var expr;
        rename = config;

        if (config[0] == ':') {
          expr = config.slice(1);

          if (!methods.hasOwnProperty(expr)) {
            throw new Error('Rename method does not exist');
          }

          rename = methods[expr](key);
        }
      }
    } else {
      console.warn('<dev-note>: remove such situation. (rename for root element)');
    }

    return {
      key: rename,
      value: value
    }
  },

  flow: function (Rule, Flow) {
    return function (name) {
      Rule.rename = name;
    }
  }
};

