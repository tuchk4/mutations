"use strict";

var mutate = require('./src/index');


// http://www.json-generator.com/
var data = [{
  "id": "53df3b43696c64dda2c5784f",
  "index": 0,
  "email": "claytonross@jasper.com",
  "tags": [
    "cupidatat",
    "quis",
    "tempor",
    "duis",
    "incididunt",
    "et",
    "nisi"
  ],
  "friends": [{
    "id": 0,
    "name": "George Grimes"
  }, {
    "id": 1,
    "name": "Huffman Cunningham"
  }, {
    "id": 2,
    "name": "Mays Deleon"
  }]
}, {
  "id": "53df3b43e2655a23e05e30d2",
  "index": 1,
  "email": "maysdeleon@jasper.com",
  "tags": [
    "exercitation",
    "eiusmod",
    "culpa",
    "reprehenderit",
    "laborum",
    "nulla",
    "labore"
  ],
  "friends": [{
    "id": 0,
    "name": "Courtney Reilly"
  }, {
    "id": 1,
    "name": "Mindy Phelps"
  }, {
    "id": 2,
    "name": "Carmen Pittman"
  }]
}, {
  "id": "53df3b43679521ba4ab96771",
  "index": 2,
  "email": "carmenpittman@jasper.com",
  "tags": [
    "commodo",
    "sit",
    "nostrud",
    "eiusmod",
    "deserunt",
    "cillum",
    "mollit"
  ],
  "friends": [{
    "id": 0,
    "name": "Kara Olson"
  }, {
    "id": 1,
    "name": "Preston Harrison"
  }, {
    "id": 2,
    "name": "Brooke Dorsey"
  }]
}];

// var result = mutate(data, {
//   map: 'id',
//   remove: ['tags'],
//   fields: {
//     friends: {
//       map: 'id',
//       rename: 'contacts'
//     },
//     'friends[0].name': {
//       rename: 'friend'
//     },
//     'index': {
//       rename: 'i'
//     }
//   }
// });


var obj = {
  a: 1,
  b: [{
    id: 1,
    name: 'test 1'
  }, {
    id: 2,
    name: 'test 2'
  }],
  c: 4,
  d: {
    a: 2
  }
};

// var result = mutate(obj, {
//   remove: ['c'],
//   fields:{
//     b: {
//       rename: 'hash',
//       map: 'id',
//       fields: {
//         name: 'NAME'
//       }
//     },
//     d: {
//       encode: function(){
//         return "encoded"
//       }
//     }
//   } 
// }, {
//   fields: {
//     hash: 'yo'
//   }
// });

// console.log(result);
// console.log(obj);

var obj = {
  id: 1,
  name: 'Plarium',
  params: [{
    id: 1,
    value: 'ACCPTED',
    test: [{
      id: 1
    }, {
      id: 2
    }]
  }, {
    id: 125,
    value: 'DENIED',
    test: [{
      id: 10
    }, {
      id: 20
    }]
  }]
};

mutate.addConversion('String_To_Number',  function(value){
  return value + '!';
});

mutate.addConversion('Number_To_String',  function(value, obj, params){
  return value + '@' + params.round;
});

mutate.addConversion('custom', function(value){
  
  value['test'] = 'HELLO WORLD';
  return value;
});

var flow = mutate.flow
  .field('yo')
    .def(function(){
      return 1;
    })
  .add(function(){
    return {
      'hello.a.b.c[0].d': 'yo'
    }
  })
  .add(function(){
    return {
      'a.b': 'a'
    }
  })

  .field('id')
    .rename('ID')

    .convert({
      from: 'String',
      to: 'Number'
    }, {
      round: 3
    })
    .convert(function(value){
      return value  + '#';
    })
    .convert('String_To_Number', {
      round: 2
    })
    .convert('toJSON')


  .field('name')
    .rename('Title')
  .field('params')
    .map('id')
    .child('value')
      .rename('status')
  .field('params')
   // .transform('custom')
    .child('test')      
      .child('id')  
        .rename('QA')
  .then()
    .field('ID')
      .rename('ID_NEXT_LOOP')
  .then()
    .field('params')
      .convert('toJSON');




// console.log(JSON.stringify(flow(obj), null, 4));

  console.log(JSON.stringify(flow.getQueue(), null, 4));
