'use strict';

var Copy = require('../utils/mutators').standalone('copy'),
  Insert = require('../utils/mutators').standalone('insert'),
  isArray = require('../utils/types').isArray;

module.exports = {
  run: function (key, value, expr, origin, transformed) {

    for (var i = 0, size = expr.length; i < size; i++) {

      var name = expr[i],
        copied = Copy(value);

      Insert(transformed, name, copied);
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function (expr) {
      if (!isArray(Rule.copy)){
        Rule.copy = [];
      }

      if (!isArray(expr)){
        expr = [expr];
      }

      Rule.copy = Rule.copy.concat(expr);
    }
  }
};

