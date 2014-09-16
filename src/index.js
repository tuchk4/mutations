"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  exist = require('./utils/types').exist,
  Mutators = require('./utils/mutators'),
  Flow = require('./flow');


function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function getRule(key, rules) {
  var rule = null;

  if (rules.hasOwnProperty('fields') && rules.fields.hasOwnProperty(key)) {
    rule = rules.fields[key];
  }

  return rule;
}

function parse(key, value, rules) {

  var rule = getRule(key, rules);

  if (rule) {

    if (!isObject(rule)) {
      rule = {
        rename: rule
      };
    }

    if (value === undefined && rule.hasOwnProperty('def')) {
      value = rule.def();
    }

    if (rule.hasOwnProperty('encode')) {
      value = rule.encode(value);
    }

    if (rule.hasOwnProperty('rename')) {
      key = rule.rename;
    }

    if (rule.hasOwnProperty('transform')) {
      var transform = rule.transform;
      if (Mutate.transforms.hasOwnProperty(transform)) { 
        value = Mutate.transforms[transform].call(null, value);
      }
    }
  }


  return {
    key: key,
    value: value
  };
}

function resolve(obj, rule) {

  var keys;

  if (rule.type == 'select') {
    keys = Object.keys(rule.fields);
  } else {
    keys = Object.keys(obj)
      .concat(Object.keys(rule.fields))
      .filter(unique);
  }

  keys = keys.filter(function(key) {
    return rule.remove.indexOf(key) == -1;
  });

  var transformed = {};

  for (var i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];

    var value = Mutators.get(obj, key, rule);

    if (isArray(value)) {
      var localRule = getRule(key, rule);

      if (localRule) {
        value = Mutate(value, localRule);
      }
    }

    var param = parse(key, value, rule);

    if (exist(param.value)) {

      Mutators.insert(transformed, param.key, param.value);
      Mutators.clean(transformed, key);
    }
  }


  return transformed;
}

function isValid(rule) {
  return !rule.hasOwnProperty('fields') || !rule.hasOwnProperty('exclude') || !['select', 'transform'].hasOwnProperty(rule.type);
}

function fillDefaults(rule) {
  if (!rule.hasOwnProperty('remove')) {
    rule.remove = [];
  }

  if (!rule.hasOwnProperty('type')) {
    rule.type = 'transform';
  }

  if (!rule.hasOwnProperty('fields')) {
    rule.fields = {};
  }
}


var Mutate = function(origin) {

  var obj = origin,
    rules = Array.prototype.slice.call(arguments, 1);

  for (var i = 0, size = rules.length; i < size; i++) {

    var rule = rules[i];

    if (!isObject(obj) || !isValid(rule)) {
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);

    var params;

    if (isArray(obj)) {
      var transformed = [];

      for (var i = 0, size = obj.length; i < size; i++) {
        transformed.push(
          resolve(obj[i], rule)
        );
      }

      if (rule.hasOwnProperty('map')) {
        params = Mutators.map(transformed, rule.map);
      } else {
        params = transformed;
      }
    } else {
      params = resolve(obj, rule);
    }

    obj = params;
  }

  return obj;
};

Flow.onExec(function() {
  return Mutate.apply(null, arguments);
});

Mutate.transforms = {};
Mutate.flow = Flow;


module.exports = Mutate;