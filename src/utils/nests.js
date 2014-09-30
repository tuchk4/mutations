'use strict';

var Nests ={
  items: {},

  dig: function (key, config) {
    if (!this.items.hasOwnProperty(key)){
      this.items[key] = [];
    }

    this.items[key].push(config);
  },

  climb: function (key) {
    this.items[key].pop();
  },

  reset: function (key) {
    if (key){
      this.items[key] = [];
    } else {
      this.items = {};
    }
  },

  collect: function (key) {
    var results;

    if (key){
      results = this.items[key];
    } else {
      results = this.items;
    }

    return results || [];
  },

  merge: function(key){
    var items = this.collect(key),
      results = [];

    for (var i = 0, size = items.length; i < size; i++){
      results = results.concat(items[i]);
    }

    return results;
  }
};


module.exports = Nests;