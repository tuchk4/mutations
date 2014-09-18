var expect = require('expect.js'),
  Mutate = require('../src/index')

describe('Mutate', function() {

  describe('#Mutate', function() {
    it('Mutate results should be same using regular and simple config (only for rename)', function() {
      var regular = [{
        fields: {
          foo: {
            rename: 'Foo'
          },
          bar: {
            rename: 'Bar',
            fields: {
              baz: {
                rename: 'Baz'
              }
            }
          }
        }
      }, {
        fields: {
          Bar: {
            rename: 'BAR'
          }
        }
      }];

      var simple = [{
        fields: {
          foo: 'Foo',
          bar: 'Bar'
        }
      }, {
        fields: {
          Bar: 'BAR'
        }
      }];

      var obj = {
        foo: 1,
        bar: 2,
        baz: 3
      }


      expect(Mutate.apply(null, [obj].concat(regular)))
        .to.be.eql(Mutate.apply(null, [obj].concat(simple)));
    });



    it('If type is select - resulst should contain only described fields', function() {

      var rules = {
        type: 'select',
        fields: {
          foo: 'Foo',
          bar: 'Bar'
        }
      };

      var obj = {
        foo: 1,
        bar: 2,
        baz: 3
      }

      expect(Mutate(obj, rules)).to.only.have.keys(['Foo', 'Bar']);
    });
  });



  describe('#Flow', function() {
    it('Mutate.flow() should be a function', function() {
      expect(Mutate.flow()).to.be.a('function');
    });

    it('Mutate.flow() should return function', function() {
      expect(Mutate.flow().field('foo')).to.be.a('function');
    });

    it('Mutate.flow().getQueue() should return mutation config', function() {
      var flow = Mutate.flow()
        .field('foo')
        .rename('Foo')
        .field('bar')
        .rename('Bar')
        .child('baz')
        .rename('Baz')
        .then()
        .field('Bar')
        .rename('BAR');

      var flowRules = flow.getQueue();

      var rules = [{
        fields: {
          foo: {
            rename: 'Foo'
          },
          bar: {
            rename: 'Bar',
            fields: {
              baz: {
                rename: 'Baz'
              }
            }
          }
        }
      }, {
        fields: {
          Bar: {
            rename: 'BAR'
          }
        }
      }];

      expect(flowRules).to.be.eql(rules);
    });
  });

  describe('#Conversions', function() {
    it('Mutate.conversions should be an object', function() {
      expect(Mutate.conversions).to.be.an('object');
    }),

    it('Mutate.addConversion should be a function', function() {
      expect(Mutate.addConversion).to.be.a('function');
    })
  });
})