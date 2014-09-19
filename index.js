"use strict";

var Mutate = require('./src/index'),
  Origin = require('./test/tests/origin');

var rules = {
  remove: ['friends[1]', 'friends[2]', 'tags'],
  fields: {
    name: {
      rename: 'N',
      remove: ['last']
    },
    friends: {
      fields: {
        id: {
          rename: 'ID'
        }
      }
    }
  }
};
var result = Mutate(Origin, rules);


console.log(JSON.stringify(result, null, 4));