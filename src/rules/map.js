'use strict';

var Map = require('../utils/mutators').map;


module.exports = {

  run: function(key, value, mapId, origin, transformed){
    return {
      key: key,
      value: Map(value, mapId)
    }
  },

  flow: function(Rule){

    return function(field){
      Rule.map = field;
    }
  }
};

