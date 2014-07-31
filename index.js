"use strict"

var transform = require('./src/index');


// as obj
var result = transform({
  id: 1,
  name: 'Valeriy',
  key: 'Efef14#41*31#$%w',
  test: {
    info: {
      state: 'Kh'
    }
  }
}, {
  fields: {
    'test.info.state': {
      rename: 'state'
    },
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