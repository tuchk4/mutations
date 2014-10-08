var Origin = require('../origin'),
  expect = require('expect.js');


module.exports = function(Mutate){    
  describe('#Mutate', function() {
    it('Mutate results should be same using regular and simple config (only for rename) and return only selected fields', function() {
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

      /**
       * If you need only rename attribute you could set new name as rule value
       */
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


    it('If type is select - results should contain only described fields', function() {
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

    it('New fields should be added', function() {
      var rules = {
        type: 'select',

        /**
         * use add for root elements
         */
        add: function(item, origin) {
          return {
            full_name: origin.name.first + ' ' + origin.name.last
          }
        },
        fields: {
          friends: {
            /**
             * use add for child elements
             */
            add: [

              function() {
                return {
                  status: true
                }
              },
              function() {
                return {
                  isActive: false
                }
              }
            ]
          }
        }
      };

      var result = Mutate(Origin, rules);

      expect(result).to.be.eql({
        full_name: 'Valarie Alvarado',
        friends: [{
          id: 1,
          name: "Marsh Goff",
          isActive: false,
          status: true
        }, {
          id: 2,
          name: "Aisha Kelley",
          isActive: false,
          status: true
        }, {
          id: 3,
          name: "Valeria Bernard",
          isActive: false,
          status: true
        }]
      });
    });


    it('def - should be added if there is no value', function() {
      var rules = {
        type: 'select',
        fields: {
          status: {
            def: function() {
              return true;
            }
          },
          online: {
            def: function() {
              return false;
            }
          }
        }
      };

      var result = Mutate(Origin, rules);

      expect(result).to.be.eql({
        status: false, // used Origin value
        online: false // used def value
      });
    });

    it('Deep renaming and array access', function() {
      var rules = {
        type: 'select',
        fields: {
          age: 'user.settings.age',
          picture: 'user.settings.picture',
          'friends[0]': 'best_friend'
        }
      };

      var result = Mutate(Origin, rules);

      expect(result).to.be.eql({
        user: {
          settings: {
            age: 37,
            picture: 'http://placehold.it/32x32'
          }
        },
        best_friend: {
          "id": 1,
          "name": "Marsh Goff"
        }
      });
    });

    it('Custom converts', function() {
      var rules = {
        type: 'select',
        fields: {
          age: {
            convert: function(age) {
              return age - 10;
            }
          },
          status: {
            convert: function(status, origin) {
              if (!status && origin.isActive) {
                return 'online';
              } else {
                return 'offline';
              }
            }
          },
          id: {
            convert: [

              function(id) {
                return id + '#'
              },
              function(id, origin, transformed) {
                return id + transformed.age;
              }
            ]
          }
        }
      };

      var result = Mutate(Origin, rules);

      expect(result).to.be.eql({
        age: 27,
        status: 'online',
        id: '541ae584ee6113f5278869d4#27'
      });
    });

    it('Custom convert types', function() {

      Mutate.addConversion('String_To_Reverse', function(value) {
        return value.split("").reverse().join("");
      });

      var rules = {
        type: 'select',
        fields: {
          id: {
            convert: 'String_To_Reverse'
          },
          eyeColor: {
            rename: 'eye',
            convert: {
              from: "string",
              to: 'reverse'
            }
          },
          'name.first': {
            convert: ['String_To_Reverse', 'String_To_Reverse']
          }
        }
      };

      var result = Mutate(Origin, rules);

      expect(result).to.be.eql({
        id: '4d9688725f3116ee485ea145',
        eye: 'nworb',
        name: {
          first: 'Valarie'
        }
      });
    });

    it('Removing items', function() {
      var rules = {
        remove: ['picture', 'isActive', 'status', 'balance', 'eyeColor', 'friends[1]', 'friends[2]', 'tags'],
        fields: {
          name: {
            remove: ['last']
          }
        }
      };
      var result = Mutate(Origin, rules);



      expect(result).to.only.have.keys(['id', 'age', 'name', 'friends']);
      expect(result.friends).to.have.length(2);
      expect(result.name).to.only.have.keys(['first']);
    });


    // it('Copying items', function() {
    //   var f = Mutate
    //     .flow()
    //     .type('select')
    //     .field('age')
    //     .rename(['age1', 'age2']);

    //   var result = f(Origin);
    //   expect(result).to.only.have.keys(['age1', 'age2']);
    //   expect(result.age1).to.be.equal(37);
    //   expect(result.age2).to.be.equal(37);
    // });

  });

}

