var Mutate = process.env.JS_COV
  ? require('./../src-cov/mutate')
  : require('../../src/mutate');

require('./describing/conversions.js')(Mutate);
require('./describing/flow.js')(Mutate);
require('./describing/mutate.js')(Mutate);