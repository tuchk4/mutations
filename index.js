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
  map: 'id'
};

var o = [
  {id: 1, a: {b: {c: { d: 1 } } } },
  {id: 2, a: {b: {c: { d: 2 } } } },
  {id: 3, a: {b: {c: { d: 3 } } } }
];

//var r = Mutate(o, {
//  map:'id',
//  fields: {
//    'a.b.c.d': {
//      rename: 'D'
//    }
//  }
//});

//console.log(JSON.stringify(o, null, 4));
//console.log(JSON.stringify(r, null, 4));

//var r = {
//  type: 'select',
//  fields: {
//    arr: {
//      convert: function(v){
//        return v.join(',');
//      }
//    }
//  }
//};
//
//var o = {
//  arr: ['1', '2', '3']
//};
//
//console.log(JSON.stringify(Mutate(o, r), null, 4));

//
//var a = [{id:1, name:2},{id:11, name:22},{id:111, name:222},{id:1111, name:2222},{id:11111, name:222222}];
//
//console.log(JSON.stringify(Mutate(a, {
//  map: 'id'
//}), null, 4));


var a = [
  {id: "a", name: "a name", friends: [
    {id: 1, name: 'f1'},
    {id:2, name:'f2'},
    {id:3, name:'f3'}
  ]},
  {id: "b", name: "b name", friends: [
    {id: 11, name: 'f11'},
    {id:22, name:'f32'},
    {id:33, name:'f33'}
  ]}
];

var Formula = Mutate.flow()
  .field('friends')
    .each(function(item){
      return item.name;
    })
    .copy('a')
    .copy('b.deep.insert')
  .then()
    .field('a')
      .concat('Any_To_Json')
      .concat('Any_To_Json2');


console.log(JSON.stringify(Formula(a), null, 4));

