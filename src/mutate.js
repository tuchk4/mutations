"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  isFunction = require('./utils/types').isFunction,
  isString = require('./utils/types').isString,
  exist = require('./utils/types').exist,
  Mutators = require('./utils/mutators'),
  Nests = require('./utils/nests'),
  Flow = require('./flow'),
  Steps = require('./utils/steps'),
  Manager = require('./manager');


function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function extractNames(config) {
  var exclude = ['fields', 'type', 'broadcast', 'remove'];

  return Object.keys(config).filter(function (key) {
    return exclude.indexOf(key) == -1;
  });

}

function extract(config) {

  var keys = extractNames(config),
    rules = {};

  for (var i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];
    rules[key] = config[key];
  }

  return rules;
}

function convert(items) {
  var path = Steps.get(),
    arr = isArray(items),
    converted = items;

  if (path) {
    if (!arr) {
      items = [items];
    }

    converted = [];

    for (var i = 0, size = items.length; i < size; i++) {
      converted.push(path + '.' + items[i]);
    }

    if (!arr) {
      converted = converted[0];
    }
  }

  return converted;
}

function isIgnoring(step, ignoring) {
  var ignore = false;

  for (var i = 0, size = ignoring.length; i < size; i++) {
    var key = ignoring[i];

    if (step.indexOf(key) == 0) {
      ignore = true;
      break;
    }
  }

  return ignore;
}

function removeNested(removing, value) {
  for (var i = 0, size = removing.length; i < size; i++) {
    var dots = removing[i];
    if (Mutators.has(value, dots)) {
      Mutators.remove(value, dots);
    }
  }
}

function resolve(origin, config) {

  var transformed = {},
    keys = [];

  if (config.type == 'select') {
    keys = Object.keys(config.fields);
  } else {
    keys = Object.keys(origin)
      .concat(Object.keys(config.fields))
      .filter(unique);
  }

  var processed;

  for (var i = 0, size = keys.length; i < size; i++) {

    var key = keys[i],
      isExists = Mutators.has(origin, key),
      value = Mutators.get(origin, key);


    Steps.addKey(key);

    var hasRules = true;

    if (!isIgnoring(Steps.get(), config.remove)) {
      if (config.fields.hasOwnProperty(key)) {

        var local = config.fields[key];

        if (isString(local)) {
          local = {
            rename: local
          };
        }

        hasRules = !!extractNames(local).length;

        if (hasRules) {
          Steps.storePath();

          processed = acceptRules(key, value, local, transformed, origin);

          key = processed.key;
          value = processed.value;
        }
      }

      if (value || isExists) {
        Mutators.insert(transformed, key, value);
      }

      if (keys[i] != key) {
        Mutators.remove(transformed, keys[i]);
      }
    }

    Steps.back();
  }

  removeNested(config.remove, transformed);

  return transformed;
}

function acceptRules(key, value, config, transformed, origin) {

  Manager.each(extractNames(config), function (rule, Source, broadcast) {
    var params = broadcast || config[rule],
      processed = Source.run(key, value, params, origin, transformed);

    if (processed && processed.hasOwnProperty('key')) {
      key = processed.key;
      value = processed.value;
    }
  });

  return {
    key: key,
    value: value
  }
}


function fillDefaults(config) {
  if (!config.hasOwnProperty('fields')) {
    config.fields = {};
  }

  if (!config.hasOwnProperty('remove')) {
    config.remove = [];
  }
}


function parse(resolve, config, append) {
  fillDefaults(config);

  var current = append = append ? append + '.' : '';

  var rules = extract(config) || {},
    remove = config.remove || [];

  remove = remove.map(function(field){
    return current + field;
  });

  resolve(append, rules, remove);

  for (var field in config.fields) {
    if (config.fields.hasOwnProperty(field)) {
      var local = config.fields[field];

      var dot = current + field;

      parse(resolve, local, dot);
    }
  }
}


function normalize(config) {
  var normalized = {
    fields: {},
    remove: []
  };

  parse(function (field, rules, remove) {

    if (Object.keys(rules).length) {
      var storage;

      if (field) {
        if (!normalized.fields.hasOwnProperty(field)) {
          normalized.fields[field] = {};
        }

        storage = normalized.fields[field];
      } else {
        storage = normalized;
      }

      for (var rule in rules) {
        if (rules.hasOwnProperty(rule)) {
          storage[rule] = rules[rule];
        }
      }
    }

    if (remove.length) {
      normalized.remove = normalized.remove.concat(remove);
    }
  }, config);

  return normalized;
}

var Mutate = function (origin) {

  var obj = origin,
    configs = Array.prototype.slice.call(arguments, 1);


  for (var i = 0, size = configs.length; i < size; i++) {
    var config = normalize(configs[i]);

    var transformed;

    if (isArray(obj)) {
      transformed = [];

      for (var j = 0, arrLength = obj.length; j < arrLength; j++) {
        var isRoot = Steps.isRoot();

        Steps.addIndex(j);

        if (Nests.merge('remove').indexOf(Steps.get()) == -1) {
          transformed.push(resolve(obj[j], config, isRoot));
        }

        Steps.back();
      }
    } else {

      transformed = resolve(obj, config);
    }


    if (Steps.isRoot() || isRoot) {
      var processed = acceptRules(undefined, transformed, config, transformed, origin);
      transformed = processed.value;
    }

    obj = transformed;
  }

  return obj;
};

Manager.link(Mutate);

Mutate.register = Manager.register;
Mutate.getRule = Manager.get;

Manager.register('add', require('./rules/add'), 0);
Manager.register('concat', require('./rules/concat'), 5);
Manager.register('def', require('./rules/def'), 10);
Manager.register('map', require('./rules/map'), 20);
Manager.register('rename', require('./rules/rename'), 30);
Manager.register('each', require('./rules/each'), 40);
Manager.register('convert', require('./rules/convert'), 60);
Manager.register('copy', require('./rules/copy'), 70);
Manager.register('merge', require('./rules/merge'), 100);
Manager.register('value', require('./rules/value'), 110);


Mutate.mutators = Mutators;
Mutate.types = {
  isArray: isArray,
  isObject: isObject,
  isString: isString,
  isFunction: isFunction
};

Mutate.flow = function () {
  var Instance = Flow.getInstance(Manager);

  Instance.onExec(function () {
    return Mutate.apply(null, arguments);
  });

  return Instance;
};

module.exports = Mutate;
