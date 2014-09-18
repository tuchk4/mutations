"use strict";

var mutate = require('./src/index');

var data = {
  I: 2,
  S: 'qwe',
  S_I: '123qwe',
  B: true,
};

var f = mutate.flow

.field('I')
  .rename('i')
  .convert({
    from: 'Number',
    to: 'String',
  })

.field('S')
  .rename('s')
  .convert({
    from: 'String',
    to: 'Integer',
  })

.field('S_I')
  .rename('si')
  .convert({
    from: 'String',
    to: 'Integer',
  })

.field('B')
  .rename('b')
  .convert({
    from: 'Boolean',
    to: 'Integer',
  })

.then()
  .field('b')
  .rename('d.f.g')
  .convert({
    from: 'Number',
    to: 'String',
  })

.then()
  .field('d')
  .convert('toJSON')

console.log(JSON.stringify(f(data), false, 1));