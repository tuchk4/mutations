'use strict';

var isArray = require('../utils/types').isArray,
  isObject = require('../utils/types').isObject,
  isFunction = require('../utils/types').isFunction,
  isString = require('../utils/types').isString,
  Mutators = require('../utils/mutators');


module.exports = {
  run: function (key, value, concat, origin, transformed) {

    if (!isArray(value)) {
      throw new Error('Concat rule could be accepted only for arrays');
    }

    if (!isArray(concat)) {
      concat = [concat];
    }

    for (var i = 0, size = concat.length; i < size; i++) {
        var item = concat[i];

      if (!isArray(item)){
        item = [item];
      }

      value = value.concat(item);
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function () {
      if (!Rule.hasOwnProperty('concat')) {
        Rule.concat = [];
      }

      var expr = arguments[0];
      if (arguments.length == 2) {
        expr = {};
        expr[arguments[0]] = arguments[1];
      }

      Rule.concat.push(expr);
    }
  }
};

