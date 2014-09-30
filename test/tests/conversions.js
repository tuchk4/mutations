var expect = require('expect.js'),
  Mutate = require('../../src/mutate')


describe('#Convertions', function () {

  it('Should convert values', function () {

    var data = {
      numberToStringField: 12.45,
      numberToBooleanField: 1,
      numberToDateField: 1411022868176,
      stringToIntegerField: '203',
      stringToNumberField: '711.5',
      stringToDateField: '2010-04-30',
      dateToStringField: new Date(Date.parse('2010-04-29')),
      booleanToIntegerField: true
    };

    var f = Mutate.flow()

      // Similar to .convert('Number_To_Sting')
      .field('numberToStringField')
      .convert({
        from: 'Number',
        to: 'String'
      })

      .field('numberToBooleanField')
      .convert({
        from: 'Number',
        to: 'Boolean'
      })

      .field('numberToDateField')
      .convert({
        from: 'Number',
        to: 'Date'
      })

      .field('stringToIntegerField')
      .convert({
        from: 'String',
        to: 'Integer'
      })

      .field('stringToNumberField')
      .convert({
        from: 'String',
        to: 'Number'
      })


      .field('stringToDateField')
      .convert({
        from: 'String',
        to: 'Date'
      })

      .field('dateToStringField')
      .convert({
        from: 'Date',
        to: 'String'
      })

      .field('booleanToIntegerField')
      .convert({
        from: 'Boolean',
        to: 'Integer'
      });

    var cData = f(data);


    expect(cData.numberToStringField).to.equal('12.45');
    expect(cData.numberToBooleanField).to.equal(true);
    expect(cData.numberToDateField).to.be.a(Date);
    expect(cData.stringToIntegerField).to.equal(203);
    expect(cData.stringToNumberField).to.equal(711.5);
    expect(cData.stringToDateField).to.be.a(Date);
    expect(cData.booleanToIntegerField).to.equal(1);
  });
});
