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

function extract(config) {
  var exclude = ['fields', 'type', 'broadcast'];

  return Object.keys(config).filter(function (key) {
    return exclude.indexOf(key) == -1;
  });
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

function isRemoving(key, value) {
  var removing = Nests.merge('remove'),
    step = Steps.get(),
    isRemoving = false;

  for (var i = 0, size = removing.length; i < size; i++) {
    var field = removing[i];
    if (field.indexOf(step) == 0) {
      if (field == step) {
        isRemoving = true;
      } else {
        Mutators.remove(value, field.replace(step, ''));
      }
      break;
    }
  }

  return isRemoving;
}

function resolve(origin, config) {

  var transformed = {},
    keys = [],
    nests = {
      broadcast: false,
      remove: false
    };

  if (config.hasOwnProperty('broadcast')) {
    Nests.dig('broadcast', config.broadcast);
    nests.broadcast = true;
  }

  if (config.hasOwnProperty('remove')) {
    Nests.dig('remove', convert(config.remove));
    nests.remove = true;
  }

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
      clone = true,
      value = Mutators.get(origin, key, clone);

    Steps.addKey(key);

    if (!isRemoving(key, value)) {
      if (config.fields.hasOwnProperty(key)) {

        var local = config.fields[key];

        if (local.hasOwnProperty('fields') || local.hasOwnProperty('remove')) {
          value = Mutate(value, local);
        }

        if (isString(local)){
          local = {
            rename: local
          }
        }

        processed = acceptRules(key, value, local, transformed, origin);

        key = processed.key;
        value = processed.value;
      }

      Mutators.insert(transformed, key, value);
    }


    Steps.back();
  }

  if (nests.broadcast) {
    Nests.climb('broadcast');
  }

  if (nests.remove) {
    Nests.climb('remove');
  }

  return transformed;
}

function acceptRules(key, value, config, transformed, origin) {

  Manager.each(extract(config), function (rule, Source, broadcast) {
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
}


var Mutate = function (origin) {

  var obj = origin,
    configs = Array.prototype.slice.call(arguments, 1);


  for (var i = 0, size = configs.length; i < size; i++) {
    var config = configs[i];

    fillDefaults(config);

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

Manager.register('add', require('./rules/add'), 0);
Manager.register('def', require('./rules/def'), 10);
Manager.register('map', require('./rules/map'), 20);
Manager.register('rename', require('./rules/rename'), 30);
Manager.register('convert', require('./rules/convert'), 40);

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