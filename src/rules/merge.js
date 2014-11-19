'use strict';

var Steps = require('../utils/steps'),
  Mutators = require('../utils/mutators');

module.exports = {

  run: function (key, src, dist, origin, transformed) {

    var current = Steps.get(),
      storage = Steps.getStorage(),
      normalized = [],
      i,
      size,
      expr = new RegExp('^' + current);

    for (i = 0, size = storage.length; i < size; i++) {
      normalized.push(storage[i].replace(expr, ''));
    }

    var items = [],
      expanded = Mutators.dots(dist),
      additional = [];

    for (i = 0, size = expanded.length; i < size; i++) {
      var isOK = true;
      for (var j = 0, normalizedSize = normalized.length; j < normalizedSize; j++) {

        if (expanded[i].indexOf(normalized[j]) == 0) {
          additional.push(normalized[j]);

          isOK = false;
          break;
        }
      }

      if (isOK) {
        items.push(expanded[i]);
      }
    }

    for (i = 0, size = items.length; i < size; i++){
      var path = items[i];

      if (!Mutators.has(src, path)){
        var  value = Mutators.get(dist, path);

        Mutators.insert(src, path , value);
      }
    }

    return {
      key: key,
      value: src
    }
  },

  flow: function (Rule) {

    return function (dist) {
      Rule.merge = dist;
    }
  }
};

