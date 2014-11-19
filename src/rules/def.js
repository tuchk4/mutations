'use strict';

var isFunction = require('../utils/types').isFunction;

module.exports = {

  run: function (key, value, def, origin, transformed) {

    if (!origin.hasOwnProperty(key)) {
      if (isFunction(def)){
        value = def(origin, transformed);
      } else {
        value = def;
      }
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {
    return function (expr) {
      Rule.def = expr;
    }
  }
};

