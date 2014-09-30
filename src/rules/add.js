'use strict';

var isArray = require('../utils/types').isArray,
  isObject = require('../utils/types').isObject,
  isFunction = require('../utils/types').isFunction,
  Mutators = require('../utils/mutators');

module.exports = {
  run: function (key, value, add, origin, transformed) {

    if (!isArray(add)) {
      add = [add];
    }

    for (var i = 0, size = add.length; i < size; i++) {
      var expr = add[i],
        added = expr;

      if (isFunction(expr)) {
        added = expr(value, origin, transformed);
      }

      if (isArray(value)) {
        if (!isArray(added)) {
          value.push(added);
        } else {
          value = value.concat(added);
        }
      } else if (isObject(added)) {

        for (var id in added) {
          if (added.hasOwnProperty(id)) {
            Mutators.insert(value, id, added[id]);
          }
        }
      } else {
        throw new Error('Wrong type for add value');
      }
    }


    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function () {
      if (!Rule.hasOwnProperty('add')) {
        Rule.add = [];
      }

      var expr = arguments[0];
      if (arguments.length == 2) {
        expr = {};
        expr[arguments[0]] = arguments[1];
      }

      Rule.add.push(expr);
    }
  }
};

