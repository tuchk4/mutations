"use strict";

var mutate = require('./src/index');


// http://www.json-generator.com/
var data = [
  {
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
    "friends": [
      {
        "id": 0,
        "name": "George Grimes"
      },
      {
        "id": 1,
        "name": "Huffman Cunningham"
      },
      {
        "id": 2,
        "name": "Mays Deleon"
      }
    ]
  },
  {
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
    "friends": [
      {
        "id": 0,
        "name": "Courtney Reilly"
      },
      {
        "id": 1,
        "name": "Mindy Phelps"
      },
      {
        "id": 2,
        "name": "Carmen Pittman"
      }
    ]
  },
  {
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
    "friends": [
      {
        "id": 0,
        "name": "Kara Olson"
      },
      {
        "id": 1,
        "name": "Preston Harrison"
      },
      {
        "id": 2,
        "name": "Brooke Dorsey"
      }
    ]
  }
];

var result = mutate(data, {
  map: 'id',
  remove: ['tags'],
  fields: {
    friends: {
      map: 'id',
      rename: 'contacts'
    },
    'friends[0].name': {
      rename: 'friend'
    },
    'index': {
      rename: 'i'
    }
  }
});

console.log(result);




