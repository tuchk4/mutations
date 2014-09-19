var Origin = require('./origin'),
  Mutate = require('../../src/index'),
  expect = require('expect.js');


describe('#Mutate', function () {

  it('Removing items', function () {
    var rules = {
      remove: ['picture', 'name.last', 'isActive', 'status', 'balance', 'eyeColor', 'friends[1]', 'friends[2]', 'tags'],
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

//    expect(result).to.only.have.keys(['id', 'age', 'name', 'friends']);
//    expect(result.friends).to.have.length(1);
//    expect(result.name).to.only.have.keys(['first']);
  });
});
