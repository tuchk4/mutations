"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  isFunction = require('./utils/types').isFunction,
  isString = require('./utils/types').isString,
  exist = require('./utils/types').exist,
  Mutators = require('./utils/mutators'),
  Flow = require('./flow'),
  Conversions = require('./conversions');

function capitalize(str) {
  str = str.toLowerCase();
  return str.replace(/(\b)([a-zA-Z])/g,
    function(firstLetter) {
      return firstLetter.toUpperCase();
    });
}

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

function getType(expr) {
  var type;
  if (expr.hasOwnProperty('from') && expr.hasOwnProperty('to')) {;
    type = capitalize(expr.from) + '_To_' + capitalize(expr.to);
  } else {
    throw new Error('Both from and to types should be defined for convert rule');
  }

  return type;
}

function parse(key, value, rules, obj) {

  var rule = getRule(key, rules);

  if (rule) {

    if (!isObject(rule)) {
      rule = {
        rename: rule
      };
    }

    if (value === undefined && rule.hasOwnProperty('def')) {
      value = rule.def(obj);
    }

    if (rule.hasOwnProperty('rename')) {
      key = rule.rename;
    }


    if (rule.hasOwnProperty('convert')) {
      for (var i = 0, size = rule.convert.length; i < size; i++) {
        var converter = rule.convert[i],
          expr = converter[0],
          params = converter[1];

        if (isFunction(expr)) {
          value = expr(value, obj);
        } else if (isString(expr) || isObject(expr)) {

          var type;
          if (isObject(expr)) {
            type = getType(expr);
          } else {
            type = expr;
          }

          if (Mutate.conversions.hasOwnProperty(type)) {
            value = Mutate.conversions[type].call(null, value, obj, params);
          } else {
            throw new Error(type + ' convert rule is not defined');
          }

        } else {
          throw new Error('Wrong convert rule');
        }
      }
    }
  }


  return {
    key: key,
    value: value
  };
}

function add(transformed, rule, origin) {

  if (rule.hasOwnProperty('add')) {
    for (var i = 0, size = rule.add.length; i < size; i++) {
      var added = rule.add[i](origin);

      if (!isObject(added)) {
        throw new Error('Added value shouled be only object');
      }

      for (var id in added) {
        if (added.hasOwnProperty(id)) {
          Mutators.insert(transformed, id, added[id]);
        }
      }
    }
  }
}

function resolve(origin, rule) {

  var keys;

  if (rule.type == 'select') {
    keys = Object.keys(rule.fields);
  } else {
    keys = Object.keys(origin)
      .concat(Object.keys(rule.fields))
      .filter(unique);
  }

  keys = keys.filter(function(key) {
    return rule.remove.indexOf(key) == -1;
  });

  var transformed = {};

  for (var i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];

    var value = Mutators.get(origin, key, rule);

    if (isArray(value)) {
      var localRule = getRule(key, rule);

      if (localRule) {
        value = Mutate(value, localRule);
      }
    }

    var param = parse(key, value, rule, origin);

    if (exist(param.value)) {
      Mutators.insert(transformed, param.key, param.value);
      Mutators.clean(transformed, key);
    }

    add(transformed, rule, origin);
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

  if (rule.hasOwnProperty('convert') && !isArray(rule.convert)) {
    rule.convert = [rule.convert];
  }

  if (rule.hasOwnProperty('add') && !isArray(rule.add)) {
    rule.add = [rule.add];
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

Mutate.conversions = Conversions;
Mutate.addConversion = function(name, func) {

  if (Mutate.conversions.hasOwnProperty(name)) {
    console.log('Notice: Converion already exist');
  }

  Mutate.conversions[name] = func;
}

Mutate.flow = Flow;


module.exports = Mutate;