"use strict";

var Mutate = require('./src/mutate'),
  Chalk = require('chalk'),
  Origin = require('./test/tests/origin');

var rules = {
  broadcast: {
    rename: ':uppercase'
  },
  remove: ['isActive', 'tags[0]'],
  fields: {
    name: {
      remove: ['last']
    },
    id: {
      rename: 'hash'
    },
    friends: {
      map: 'id',
   //  remove: ['name'],
      convert: 'toJSON',
      rename: 'connections',
      add: [{id: 6}, [{id:8}, {id:9}], function(origin, transformed){
        return [{
          id: 6
        }, {
          id: 7
        }]
      }],
      fields: {
        name: {
          rename: 'first_name'
        }
      }
    }
  }
};


//var result = Mutate(Origin, rules);

var flow = Mutate.flow()
  .remove(['tags[0]', 'name.first'])
  .add('numbers', '123')

  .field('access')
    .def(0)

  .field('friends')
    .map('name')

  .field('isActive')
    .rename('asd')

  .field('isActive')
    .remove()

  .field('id')
    .rename('hash')

  .then()
    .field('friends')
      .convert({
        from: 'any',
        to: 'json'
      });


console.log(Chalk.magenta(JSON.stringify(flow.getQueue(), null, 4)));
console.log(Chalk.yellow(JSON.stringify(flow(Origin), null, 4)));
