'use strict';

var isArray = require('../utils/types').isArray,
  isObject = require('../utils/types').isObject,
  isFunction = require('../utils/types').isFunction,
  isString = require('../utils/types').isString,
  Mutators = require('../utils/mutators');


function insert(added, value){
  for (var id in added) {
    if (added.hasOwnProperty(id)) {
      Mutators.insert(value, id, added[id]);
    }
  }
}

module.exports = {
  run: function (key, value, add, origin, transformed) {

    if (!isArray(add)) {
      add = [add];
    }


    for (var i = 0, size = add.length; i < size; i++) {
      var expr = add[i],
        added = expr;

      if (isArray(value)) {
        for (var j = 0, len = value.length; j < len; j++) {
          var item = value[j];

          if (isFunction(expr)) {
            added = expr(item, origin, transformed);
          }

          if (isString(added)){
            added = [added];
          }

          if (isArray(added) || !isObject(added)){
            throw new Error('Wrong add value');
          }

          insert(added, item);
        }
      } else if (isObject(value)) {
        if (isFunction(expr)) {
          added = expr(value, origin, transformed);
        }

        insert(added, value);
      } else {
        throw new Error('Wrong parent element for add rule');
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

