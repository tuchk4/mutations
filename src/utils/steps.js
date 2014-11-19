'use strict';


var Steps  = {
  path: [],
  storage: [],

  back: function () {
   this.path.pop();
  },

  addKey: function (key) {
    this.path.push({
      value: key,
      type: 'key'
    });
  },

  addIndex: function (i) {
    this.path.push({
      value: i,
      type: 'index'
    });
  },

  clear: function () {
    this.path = [];
    this.storage = [];
  },

  get: function (income) {
    var path = '',
      storage = income || this.path;

    for (var i = 0, size = storage.length; i < size; i++) {
      var item = storage[i];

      if (item.type == 'key') {
        if (i == 0) {
          path = item.value;
        } else {
          path += '.' + item.value;
        }
      } else if (item.type == 'index') {
        path += '[' + item.value + ']';
      }
    }

    return path;
  },

  isRoot: function(){
    return !this.path.length;
  },

  storePath: function(){
    var path = this.get();

    this.storage.push(path);
  },

  getStorage: function(){
    return this.storage;
  }
};


module.exports = Steps;
