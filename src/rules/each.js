'use strict';

var isArray = require('../utils/types').isArray,
  Convert= require('./convert');


module.exports = {
  run: function (key, value, expr, origin, transformed) {
    if (!isArray(value)){
      throw new Error('Rule "each" could be accepted only for arrays');
    }

    var results = [];

    for (var i = 0, size = value.length; i < size; i++){
      var converted =  Convert.run(i, value[i], expr, origin, transformed)
      results.push(converted.value);
    }

    return {
      key: key,
      value: results
    }
  },

  flow: function (Rule) {

    return function (expr) {
      Rule.each = expr;
    }
  }
};

