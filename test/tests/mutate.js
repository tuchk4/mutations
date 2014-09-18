
var Origin = require('./origin'),
  Mutate = require('../../src/index'),
  expect = require('expect.js');


describe('#Mutate', function () {
  it('Mutate results should be same using regular and simple config (only for rename) and return only selected fields', function () {
    var regular = {
      type: 'select',
      fields: {
        id: {
          rename: 'hash'
        },
        isActive: {
          rename: 'active'
        },
        'name.first': {
          rename: 'first_name'
        }
      }
    };

    var simple = {
      type: 'select',
      fields: {
        id: 'hash',
        isActive: 'active',
        'name.first': 'first_name'
      }
    };

    expect(Mutate.apply(null, [Origin].concat(regular)))
      .to.be.eql(Mutate.apply(null, [Origin].concat(simple)));
  });


  it('If type is select - results should contain only described fields', function () {
    var rules = {
      type: 'select',
      fields: {
        id: 'hash',
        isActive: 'active',
        'name.first': 'first_name'
      }
    };

    var result = Mutate(Origin, rules);

    expect(result).to.be.eql({
      hash: '541ae584ee6113f5278869d4',
      active: true,
      first_name: 'Valarie'
    });

    expect(result).to.only.have.keys(['hash', 'active', 'first_name']);
  });
});
