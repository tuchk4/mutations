"use strict"

var transform = require('./src/index');

// as arr
var result = transform([{
  id: 1,
  name: 'Valeriy',
  key: 'Efef14#41*31#$%w'
}], {
  type: 'select',
  fields: {
    name: {
      rename: 'my.info.name'
    },
    key: {
      encode: function(value){
        return '!!@##' + '____' + value;
      }
    }
  }
});

// as obj
var result = transform({
  id: 1,
  name: 'Valeriy',
  key: 'Efef14#41*31#$%w'
}, {
  type: 'select',
  fields: {
    name: {
      rename: 'my.info.name'
    },
    key: {
      encode: function(value){
        return '!!@##' + '____' + value;
      }
    }
  }
});

console.log(result);