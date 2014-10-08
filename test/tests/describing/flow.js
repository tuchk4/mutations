var expect = require('expect.js'),  
  Origin = require('../origin');

module.exports = function(Mutate){
  describe('#Flow', function () {
    it('Mutate.flow() should be a function', function () {
      expect(Mutate.flow()).to.be.a('function');
    });

    it('Mutate.flow() should return function', function () {
      expect(Mutate.flow().field('foo')).to.be.a('function');
    });

    it('Mutate.flow().getQueue() should return mutation config', function () {
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

      var rules = [
        {
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
        },
        {
          fields: {
            Bar: {
              rename: 'BAR'
            }
          }
        }
      ];

      expect(flowRules).to.be.eql(rules);
    });
  });
}