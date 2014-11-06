'use strict';

var isObject = require('../utils/types').isObject,
  isArray = require('../utils/types').isArray;

var methods = {
  uppercase: function (key) {
    return key.toUpperCase();
  },

  lowercase: function (key) {
    return key.toLowerCase();
  },

  toCamelCase: function(key){
    return key.replace(/(\_[a-z])/g, function($1){
      return $1.toUpperCase().replace('_','');
    });
  },

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

    /**
     * If not root element
     */
    if (key !== undefined) {
      var rename = config,
        expr;

      if (config[0] == ':') {
        expr = config.slice(1);


        if (!methods.hasOwnProperty(expr)) {
          throw new Error('Rename method does not exist');
        }

        rename = methods[expr](key);
      }
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

