'use strict';
var isArray = require('./types').isArray,
  exist = require('./types').exist,
  re = /(\w+)|(\[\d+\])/g;

module.exports = {

  getPart: function getPart(key){
    var sliced = key.slice(1).slice(0, -1);

    if (key[0] == '[' && key[key.length - 1] == ']' && sliced % 1 == 0){
      key = sliced;
    }

    return key;
  },

  get: function get(obj, path){
    var parts = path.match(re),
      current = obj;

    for (var i = 0, size = parts.length; i < size; ++i) {
      var part = this.getPart(parts[i]);

      if(current[part] === undefined) {
        return undefined;
      } else {
        current = current[part];
      }
    }

    return current;
  },

  insert: function insert(obj, key, value){
    var parts = key.match(/(\w+)|(\[\d+\])/g);

    for (var i = 0, size = parts.length; i < size - 1; i++) {
      var part = this.getPart(parts[i]),
        next,
        isArray;

      if (size - 1 != 0){
        next = this.getPart(parts[i + 1]);
        isArray = next % 1 == 0;
      }

      if (obj[part] === undefined){
        obj[part] = isArray ? [] : {};
      }

      obj = obj[part];
    }

    obj[this.getPart(parts[parts.length - 1])] = value;
  },

  clean: function(obj, path){
    var parts = path.match(re);

    for (var i = 0, size = parts.length; i < size; i++){
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (!exist(obj[part])) {
          delete obj[part];
          break;
        }
      }
    }
  },

  remove: function remove(obj, path){

    var parts = path.match(re),
      last = this.getPart(parts.pop()),
      isExist = true;

    for (var i = 0, size = parts.length; i < size; i++){
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (obj[part] != undefined) {
          obj = obj[part];
        } else {
          isExist = false;
          break;
        }
      } else {
        isExist = false;
        break;
      }
    }

    if (isExist){
      if (last % 1 == 0){
        obj.splice(last, 1);
      } else {
        delete obj[last];
      }
    }
  },

  map: function map(data, field){
    if (!isArray(data) && field){
      throw new Error('Map is available only for arrays');
    }

    var mapped = {};

    for (var i = 0, size = data.length; i < size; i++){
      if (!data[i].hasOwnProperty(field)){
        throw new Error('Map field does not exist in the object');
      }    

      mapped[data[i][field]] = data[i];
    }

    return mapped;
  }
};