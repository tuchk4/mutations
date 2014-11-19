'use strict';

module.exports = {

  run: function(key, value, ruleValue, origin, transformed){
    return {
      key: key,
      value: ruleValue
    }
  },

  flow: function(Rule){

    return function(value){
      Rule.value = value;
    }
  }
};

