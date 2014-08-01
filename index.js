"use strict"

var transform = require('./src/index');


var data = [
  {
    id: 1,
    title: 'Hello',
    likes: 100,
    comments: [
      {
        message: 'Yo message 1'
      },
      {
        message: 'Yo message 2'
      }
    ],
    settings: {
      type: 'post',
      visible: true,
      url: '/'
    }
  },
  {
    id: 2,
    title: 'Yo',
    likes: 90,
    comments: [
      {
        message: 'Yo message 1'
      },
      {
        message: 'Yo message 2'
      }
    ],
    settings: {
      type: 'blog',
      visible: true,
      url: '/#'
    }
  },
  {
    id: 3,
    title: 'Alloha',
    likes: 80,
    comments: [
      {
        message: 'Alloha message 1'
      },
      {
        message: 'Alloha message 2'
      }
    ],
    settings: {
      type: 'post',
      visible: false,
      url: '/#!'
    }
  }
];

var result = transform(data, {
  map: 'name',
  remove: ['comments[0]', 'settings.type'],
  fields: {
    title: {
      rename: 'name'
    },
    'settings.url': {
      rename: 'url'
    },
    'settings.visible': {
      rename: 'isVisible'
    },

    'comments[0]': {
      rename: 'first_comment'
    }
  }
});

console.log(result);
console.log(data);

console.log('');
console.log('');
console.log('');
console.log('');



