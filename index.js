"use strict";

var Mutate = require('./src/mutate'),
  Origin = require('./test/tests/origin');


var Origin = {
  "id": "541ae584ee6113f5278869d4",
  "isActive": true,
  "status": false,
  "balance": "$2,211.13",
  "picture": "http://placehold.it/32x32",
  "age": 37,

  "name": {
    "first": "Valarie",
    "last": "Alvarado"
  },
  "tags": [
    "irure",
    "adipisicing",
    "laborum",
    "eiusmod",
    "elit",
    "tempor",
    "enim"
  ],

  "friends": [
    {
      "id": 1,
      "name": "Marsh Goff"
    },
    {
      "id": 2,
      "name": "Aisha Kelley"
    },
    {
      "id": 3,
      "name": "Valeria Bernard"
    }
  ],

  "eyeColor": "brown"
};

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
      convert: {
        from: 'any',
        to: 'json',
        params: 'asdas'
      },
      rename: 'connections',
      add: [
        {id: 6},
        [
          {id: 8},
          {id: 9}
        ],
        function (origin, transformed) {
          return [
            {
              id: 6
            },
            {
              id: 7
            }
          ]
        }
      ],
      fields: {
        name: {
          rename: 'first_name'
        }
      }
    }
  }
};


//Mutate(Origin, rules);


/**
 *
 */



var flow = Mutate.flow()
  .broadcast('rename', ':uppercase')
  .remove(['tags[0]', 'name.first'])
  .add('numbers', '123')

  .field('access')
    .def(0)

  .field('friends')
    .add(function (item) {
      return {
        test: item.name + '!'
      }
    })

  .field('isActive')
    .rename('asd')

  .field('isActive')
    .remove()

  .field('id')
    .rename('hash')

  .then()
    .field('FRIENDS')
      .convert({
        from: 'any',
        to: 'json'
      });


/**
 *
 */
var config = {
  map:'id'
};


var r = Mutate([
  {id: 1},
  {id: 2},
  {id: 3}
], {
  map:'id'
});

console.log(JSON.stringify(r, null, 4));