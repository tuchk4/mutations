!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.mutate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

var isArray = _dereq_('./utils/types').isArray,
  isObject = _dereq_('./utils/types').isObject,
  isFunction = _dereq_('./utils/types').isFunction,
  isString = _dereq_('./utils/types').isString,
  exist = _dereq_('./utils/types').exist,
  Mutators = _dereq_('./utils/mutators'),
  Nests = _dereq_('./utils/nests'),
  Flow = _dereq_('./flow'),
  Steps = _dereq_('./utils/steps'),
  Manager = _dereq_('./manager');


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
      isExists = Mutators.has(origin, key),
      value = Mutators.get(origin, key);

    Steps.addKey(key);

    if (!isRemoving(key, value)) {
      if (config.fields.hasOwnProperty(key)) {

        var local = config.fields[key];

        if (local.hasOwnProperty('fields') || local.hasOwnProperty('remove')) {
          value = Mutate(value, local);
        }

        if (isString(local)) {
          local = {
            rename: local
          };
        }

        processed = acceptRules(key, value, local, transformed, origin);

        key = processed.key;
        value = processed.value;
      }

      if (value || isExists){
        Mutators.insert(transformed, key, value);
      }

      if (keys[i] != key) {
        Mutators.remove(transformed, keys[i]);
        Mutators.clean(transformed, keys[i]);
      }
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
Mutate.getRule = Manager.get;

Manager.register('add', _dereq_('./rules/add'), 0);
Manager.register('concat', _dereq_('./rules/concat'), 5);
Manager.register('def', _dereq_('./rules/def'), 10);
Manager.register('map', _dereq_('./rules/map'), 20);
Manager.register('rename', _dereq_('./rules/rename'), 30);
Manager.register('each', _dereq_('./rules/each'), 40);
Manager.register('convert', _dereq_('./rules/convert'), 60);
Manager.register('copy', _dereq_('./rules/copy'), 70);


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

},{"./flow":2,"./manager":3,"./rules/add":4,"./rules/concat":5,"./rules/convert":6,"./rules/copy":7,"./rules/def":8,"./rules/each":9,"./rules/map":10,"./rules/rename":11,"./utils/mutators":12,"./utils/nests":13,"./utils/steps":14,"./utils/types":15}],2:[function(_dereq_,module,exports){
'use strict';

var isArray = _dereq_('./utils/types').isArray,
  isObject = _dereq_('./utils/types').isObject,
  Mutators = _dereq_('./utils/mutators');

function getFlow() {

  var rules = {},
    queue = [],
    current = [],
    onExec,
    AVAILABLE_TYPES = ['transform', 'select'];

  function initRules() {
    current = [];
    rules = {
      fields: {}
    }
  }

  function isEmpty() {

    var isExists = false;
    for (var rule in rules) {
      if (rules.hasOwnProperty(rule)
        && rule != 'fields'
        && rule != 'remove') {

        isExists = true;
        break;
      }
    }

    if (!isExists) {
      for (var field in rules.fields) {
        if (rules.fields.hasOwnProperty(field)) {
          isExists = true;
          break;
        }
      }
    }

    var isRemoveEmpty = !rules.hasOwnProperty('remove') || rules.remove.length == 0;

    return isRemoveEmpty && !isExists;
  }

  function getRule(d) {
    var obj = rules;

    if (arguments.length == 0) {
      d = 0;
    }

    for (var i = 0, size = current.length - d; i < size; i++) {
      var field = current[i];
      if (!obj.hasOwnProperty('fields')) {
        obj.fields = {};
      }

      if (!obj.fields.hasOwnProperty(field)) {
        obj.fields[field] = {};
      }

      obj = obj.fields[field];
    }

    return obj;
  }

  function getField() {
    return current[current.length - 1];
  }


  function isCurrentSelected() {
    if (!current) {
      throw new Error('Select field before actions');
    }
  }

  function addField(field) {
    if (!rules.fields.hasOwnProperty(field)) {
      rules.fields[field] = {};
    }
  }

  function pushQueue() {
    queue.push(rules);
  }

  initRules();

  var Flow = function (source) {
    if (!onExec) {
      throw new Error('Should be defined on exec function');
    }

    var queue = Flow.getQueue();

    return onExec.apply(null, [source].concat(queue));
  };

  Flow.onExec = function (on) {
    onExec = on;
  };

  Flow.getQueue = function () {
    if (!isEmpty()) {
      Flow.then();
    }

    return queue;
  };

  /**
   * Default Flow methods
   */
  Flow.type = function (type) {
    if (AVAILABLE_TYPES.indexOf(type) == -1) {
      throw new Error('Unsupported transform type');
    }

    rules.type = type;

    return this;
  };


  Flow.then = function () {
    if (!isEmpty()){
      pushQueue();
    }
    initRules();


    return this;
  };

  Flow.field = function (field) {
    addField(field);
    current = [field];

    return this;
  };

  Flow.child = function (field) {
    current.push(field);

    return this;
  };

  Flow.remove = function (field) {
    isCurrentSelected();

    field = field || getField();

    var rule;

    if (!!arguments.length) {
      rule = rules;
    } else {
      rule = getRule(1);
    }


    if (!rule.hasOwnProperty('remove')) {
      rule.remove = [];
    }

    if (isArray(field)) {
      rule.remove = rules.remove.concat(field);
    } else {
      rule.remove.push(field);
    }

    Mutators.remove(rule, 'fields.' + field);

    return this;
  };

  Flow.broadcast = function () {
    isCurrentSelected();

    var rule = getRule();

    if (arguments.length == 2) {
      if (!isObject(rule.broadcast)) {
        rule.broadcast = {};
      }

      rule.broadcast[arguments[0]] = arguments[1];
    } else if (isObject(arguments[0])) {
      rule.broadcast = arguments[0];
    } else {
      throw new Error('Wrong broadcast parameters')
    }

    return this;
  };

  return {
    getRule: getRule,
    getField: getField,
    instance: Flow,
    isCurrentSelected: isCurrentSelected
  }
}


module.exports = {
  getInstance: function (Manager) {
    var Flow = getFlow(),
      Instance = Flow.instance;

    Manager.eachSource(function (name, Source) {
      if (Source.hasOwnProperty('flow')) {
        Instance[name] = function () {
          Flow.isCurrentSelected();

          var expr = Source.flow(Flow.getRule(), Flow.getField());
          expr.apply(Source, arguments);

          return Instance;
        }
      }
    });

    return Instance;
  }
};

},{"./utils/mutators":12,"./utils/types":15}],3:[function(_dereq_,module,exports){
'use strict';

var isObject = _dereq_('./utils/types').isObject,
  isFunction = _dereq_('./utils/types').isFunction,
  isArray = _dereq_('./utils/types').isArray,
  Map = _dereq_('./utils/mutators').map,
  Nests = _dereq_('./utils/nests');


function unique(value, index, self) {
  return self.indexOf(value) === index;
}

var Manager = {
  rules: [],

  register: function (key, source, priority) {
    priority = parseInt(priority, 10) || 0;

    if (this.rules.hasOwnProperty(key)) {
      throw new Error('Rule already added');
    }

    this.rules[key] = {
      rule: key,
      source: source,
      priority: priority
    };

    this.exports(key, source);
  },

  has: function (key) {
    return this.rules.hasOwnProperty(key);
  },

  get: function(key){
    if (!this.has(key)){
      throw new Error('Rule does not exists');
    }

    return this.rules[key];
  },

  link: function (Mutate) {
    this.Mutate = Mutate;
  },

  eachSource: function (expr) {
    for (var rule in this.rules) {
      if (this.rules.hasOwnProperty(rule)) {
        expr(rule, this.rules[rule].source);
      }
    }
  },

  each: function () {
    var expr,
      available = [];

    if (arguments.length == 1) {
      expr = arguments[0];
    } else if (arguments.length == 2) {
      available = arguments[0];
      expr = arguments[1];
    }

    var list = [],
      rule, i, size;

    for (rule in this.rules) {
      if (this.rules.hasOwnProperty(rule) && (available.length && available.indexOf(rule) != -1)) {
        list.push(this.rules[rule]);
      }
    }


    var broadcasts = Nests.collect('broadcast');
    for (i = 0, size = broadcasts.length; i < size; i++) {
      var rules = broadcasts[i];
      for (rule in rules) {
        if (rules.hasOwnProperty(rule)) {

          if (!this.rules.hasOwnProperty(rule)) {
            throw new Error('Rule ' + rule + ' is not registered. Defined at broadcast config)');
          }

          list.push({
            rule: rule,
            source: this.rules[rule].source,
            priority: this.rules[rule].priority,
            broadcast: rules[rule]
          });
        }
      }
    }


    list.sort(function (a, b) {
      return a.priority - b.priority;
    });

    for (i = 0, size = list.length; i < size; i++) {
      var config = list[i];

      expr(config.rule, config.source, config.broadcast);
    }
  },

  exports: function (name, Source) {
    var exports = Source.exports,
      Mutate = this.Mutate;

    if (isObject(exports)) {
      for (var method in exports) {
        if (exports.hasOwnProperty(method)) {
          if (Mutate.hasOwnProperty(method)) {
            console.info('Export method already exists');
          }

          Mutate[method] = exports[method];
        }
      }
    } else if (isFunction(exports)) {
      Mutate[name] = exports;
    }
  }
};

module.exports = Manager;

},{"./utils/mutators":12,"./utils/nests":13,"./utils/types":15}],4:[function(_dereq_,module,exports){
'use strict';

var isArray = _dereq_('../utils/types').isArray,
  isObject = _dereq_('../utils/types').isObject,
  isFunction = _dereq_('../utils/types').isFunction,
  isString = _dereq_('../utils/types').isString,
  Mutators = _dereq_('../utils/mutators');


function insert(added, value){
  for (var id in added) {
    if (added.hasOwnProperty(id)) {
      Mutators.insert(value, id, added[id]);
    }
  }
}

module.exports = {
  run: function (key, value, add, origin, transformed) {

    if (!isArray(add)) {
      add = [add];
    }


    for (var i = 0, size = add.length; i < size; i++) {
      var expr = add[i],
        added = expr;

      if (isArray(value)) {
        for (var j = 0, len = value.length; j < len; j++) {
          var item = value[j];

          if (isFunction(expr)) {
            added = expr(item, origin, transformed);
          }

          if (isString(added)){
            added = [added];
          }

          if (isArray(added) || !isObject(added)){
            throw new Error('Wrong add value');
          }

          insert(added, item);
        }
      } else if (isObject(value)) {
        if (isFunction(expr)) {
          added = expr(value, origin, transformed);
        }

        insert(added, value);
      } else {
        throw new Error('Wrong parent element for add rule');
      }
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function () {
      if (!Rule.hasOwnProperty('add')) {
        Rule.add = [];
      }

      var expr = arguments[0];
      if (arguments.length == 2) {
        expr = {};
        expr[arguments[0]] = arguments[1];
      }

      Rule.add.push(expr);
    }
  }
};


},{"../utils/mutators":12,"../utils/types":15}],5:[function(_dereq_,module,exports){
'use strict';

var isArray = _dereq_('../utils/types').isArray,
  isObject = _dereq_('../utils/types').isObject,
  isFunction = _dereq_('../utils/types').isFunction,
  isString = _dereq_('../utils/types').isString,
  Mutators = _dereq_('../utils/mutators');


module.exports = {
  run: function (key, value, concat, origin, transformed) {

    if (!isArray(value)) {
      throw new Error('Concat rule could be accepted only for arrays');
    }

    if (!isArray(concat)) {
      concat = [concat];
    }

    for (var i = 0, size = concat.length; i < size; i++) {
        var item = concat[i];

      if (!isArray(item)){
        item = [item];
      }

      value = value.concat(item);
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function () {
      if (!Rule.hasOwnProperty('concat')) {
        Rule.concat = [];
      }

      var expr = arguments[0];
      if (arguments.length == 2) {
        expr = {};
        expr[arguments[0]] = arguments[1];
      }

      Rule.concat.push(expr);
    }
  }
};


},{"../utils/mutators":12,"../utils/types":15}],6:[function(_dereq_,module,exports){
'use strict';

var Types = _dereq_('../utils/types');


function capitalize(str) {
  str = str.toLowerCase();
  return str.replace(/(\b)([a-zA-Z])/g,
    function (firstLetter) {
      return firstLetter.toUpperCase();
    });
}


function getType(expr) {
  var type;
  if (expr.hasOwnProperty('from') && expr.hasOwnProperty('to')) {

    type = capitalize(expr.from) + '_To_' + capitalize(expr.to);
  } else {
    throw new Error('Both from and to types should be defined for convert rule');
  }

  return type;
}


function err(checkKey, value) {
  throw new TypeError('Type check failed: ' + checkKey + '(' + JSON.stringify(value) + ')');
}

function checkType(checkKey, value) {
  var check = Types[checkKey];

  if (!check(value)) {
    err(checkKey, value);
  }
}

var conversions = {
  Any_To_Json: function (value, origin, param) {
    return JSON.stringify(value);
  },

  Array_To_Json: function (value) {
    checkType('isArray', value);
    return this.Any_To_Json(value);
  },

  Object_To_Json: function (value) {
    if (!Types.isObject(value) || Types.isArray(value)) {
      err('isObject and !isArray', value);
    }
    return this.Any_To_Json(value);
  },

  Number_To_String: function (value) {
    checkType('isNumber', value);
    return value.toString();
  },

  Number_To_Boolean: function (value) {
    checkType('isNumber', value);
    return !!value;
  },

  Number_To_Date: function (value) {
    checkType('isNumber', value);
    return new Date(value);
  },

  String_To_Integer: function (value) {
    checkType('isString', value);
    return parseInt(value, 10);
  },

  String_To_Number: function (value) {
    checkType('isString', value);
    return parseFloat(value, 10);
  },

  String_To_Date: function (value) {
    checkType('isString', value);
    return new Date(Date.parse(value));
  },

  Date_To_String: function (value) {
    checkType('isDate', value);
    return '' + value;
  },

  Boolean_To_Integer: function (value) {
    checkType('isBoolean', value);
    return +value;
  }
};

module.exports = {

  exports: {
    addConversion: function (name, func) {
      if (conversions.hasOwnProperty(name)) {
        console.log('Notice: Conversion already exist');
      }

      conversions[name] = func;
    }
  },

  run: function (key, value, convert, origin, transformed) {
    if (!Types.isArray(convert)) {
      convert = [convert];
    }

    var converted = value;

    for (var i = 0, size = convert.length; i < size; i++) {
      var converter = convert[i];

      if (Types.isFunction(converter)) {
        converted = converter(converted, origin, transformed);

      } else if (Types.isString(converter) || Types.isObject(converter) || Types.isArray(converter)) {
        var expr = converter,
          params = undefined;

        if (Types.isArray(converter)) {
          expr = converter[0];

          if (Types.isObject(expr) && expr.hasOwnProperty('params')){
            throw new Error('Wrong convert rule. Params defined in object and as second arr value');
          }

          params = converter[1];
        }

        var type;
        if (Types.isObject(expr)) {
          type = getType(expr);

          if (expr.hasOwnProperty('params')){
            params = expr.params;
          }
        } else {
          type = expr;
        }

        if (conversions.hasOwnProperty(type)) {
          converted = conversions[type].call(conversions, converted, origin, params);
        } else {
          throw new Error(type + ' convert rule is not defined');
        }

      } else {
        throw new Error('Wrong convert rule');
      }
    }


    return {
      key: key,
      value: converted
    }
  },

  flow: function (Rule) {


    return function (expr, params) {
      if (!Rule.hasOwnProperty('convert')) {
        Rule.convert = [];
      }

      if (Types.isFunction(expr)) {
        Rule.convert.push(expr);
      } else {
        Rule.convert.push([expr, params]);
      }
    }
  }
};


},{"../utils/types":15}],7:[function(_dereq_,module,exports){
'use strict';

var Copy = _dereq_('../utils/mutators').standalone('copy'),
  Insert = _dereq_('../utils/mutators').standalone('insert'),
  isArray = _dereq_('../utils/types').isArray;

module.exports = {
  run: function (key, value, expr, origin, transformed) {

    for (var i = 0, size = expr.length; i < size; i++) {

      var name = expr[i],
        copied = Copy(value);

      Insert(transformed, name, copied);
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {

    return function (expr) {
      if (!isArray(Rule.copy)){
        Rule.copy = [];
      }

      if (!isArray(expr)){
        expr = [expr];
      }

      Rule.copy = Rule.copy.concat(expr);
    }
  }
};


},{"../utils/mutators":12,"../utils/types":15}],8:[function(_dereq_,module,exports){
'use strict';

var isFunction = _dereq_('../utils/types').isFunction;

module.exports = {

  run: function (key, value, def, origin, transformed) {

    if (value === undefined) {
      if (isFunction(def)){
        value = def(origin, transformed);
      } else {
        value = def;
      }
    }

    return {
      key: key,
      value: value
    }
  },

  flow: function (Rule) {
    return function (expr) {
      Rule.def = expr;
    }
  }
};


},{"../utils/types":15}],9:[function(_dereq_,module,exports){
'use strict';

var isArray = _dereq_('../utils/types').isArray,
  Convert= _dereq_('./convert');


module.exports = {
  run: function (key, value, expr, origin, transformed) {
    if (!isArray(value)){
      throw new Error('Rule "each" could be accepted only for arrays');
    }

    var results = [];

    for (var i = 0, size = value.length; i < size; i++){
      var converted =  Convert.run(i, value[i], expr, origin, transformed)
      results.push(converted.value);
    }

    return {
      key: key,
      value: results
    }
  },

  flow: function (Rule) {

    return function (expr) {
      Rule.each = expr;
    }
  }
};


},{"../utils/types":15,"./convert":6}],10:[function(_dereq_,module,exports){
'use strict';

var Map = _dereq_('../utils/mutators').map;


module.exports = {

  run: function(key, value, mapId, origin, transformed){
    return {
      key: key,
      value: Map(value, mapId)
    }
  },

  flow: function(Rule){

    return function(field){
      Rule.map = field;
    }
  }
};


},{"../utils/mutators":12}],11:[function(_dereq_,module,exports){
'use strict';

var isObject = _dereq_('../utils/types').isObject,
  isArray = _dereq_('../utils/types').isArray,
  isFunction = _dereq_('../utils/types').isFunction;

var methods = {
  uppercase: function (key) {
    return key.toUpperCase();
  },

  lowercase: function (key) {
    return key.toLowerCase();
  },

  // TODO: add support for symbols ! @ $ % etc.
  toCamelCase: function(key){
    return key.replace(/(\_[a-z])/g, function($1){
      return $1.toUpperCase().replace('_','');
    });
  },

  // TODO: add support for symbols ! @ $ % etc.
  toSnakeCase: function(key){
    return key.replace(/([A-Z])/g, function($1){
      return "_"+$1.toLowerCase();
    });
  }
};


function renameObject(method, origin) {
  var transformed = {};

  for (var attr in origin) {
    if (origin.hasOwnProperty(attr)) {

      var rename = method(attr);

      if (isObject(origin[attr]) && !isArray(origin[attr])) {
        transformed[rename] = renameObject(method, origin[attr]);
      } else {
        transformed[rename] = origin[attr];
      }
    }
  }

  return transformed;
}


module.exports = {
  exports: {
    addRenameMethod: function (key, method) {
      if (methods.hasOwnProperty(key)) {
        console.log('Notice: Rename method already exist');
      }
      methods[key] = method;
    }
  },

  run: function (key, value, config, origin, transformed) {

    /**
     * If not root element
     */
    if (key !== undefined) {
      var rename;

      if (isFunction(config)){
        rename = config(key);
      } else {
        var expr;
        rename = config;

        if (config[0] == ':') {
          expr = config.slice(1);

          if (!methods.hasOwnProperty(expr)) {
            throw new Error('Rename method does not exist');
          }

          rename = methods[expr](key);
        }
      }
    } else {
      console.warn('<dev-note>: remove such situation. (rename for root element)');
    }

    return {
      key: rename,
      value: value
    }
  },

  flow: function (Rule, Flow) {
    return function (name) {
      Rule.rename = name;
    }
  }
};


},{"../utils/types":15}],12:[function(_dereq_,module,exports){
'use strict';
var isArray = _dereq_('./types').isArray,
  isObject = _dereq_('./types').isObject,
  exist = _dereq_('./types').exist,
  re = /(\w+)|(\[\d+\])/g;

var Mutators = {

  getPart: function getPart(key) {
    var sliced = key.slice(1).slice(0, -1);

    if (key[0] == '[' && key[key.length - 1] == ']' && sliced % 1 == 0) {
      key = sliced;
    }

    return key;
  },

  /**
   * Care about this xD
   */
  isPlain: function(value){
    return value.constructor === Object;
   },

  has: function(obj, path){
    var parts = path.split('.'),
      storage = obj,
      key = path;

    if (parts.length > 1){
      key = parts.pop();

      var parent = parts.join('.');

      storage = this.get(obj, parent);
    }

    return storage.hasOwnProperty(key);

  },

  get: function get(obj, path) {
    var parts = path.match(re),
      current = obj;

    for (var i = 0, size = parts.length; i < size; ++i) {
      var part = this.getPart(parts[i]);

      if (current[part] === undefined) {
        return undefined;
      } else {
        current = current[part];
      }
    }

    return this.copy(current);;
  },

  copy: function(value){
    var result;

    if (isObject(value) && !isArray(value) && !this.isPlain(value)){
      result = value;
    } else {
      result = this.clone(value);
    }

    return result;
  },

  insert: function insert(obj, key, value) {
    var parts = key.match(/(\w+)|(\[\d+\])/g);

    for (var i = 0, size = parts.length; i < size - 1; i++) {
      var part = this.getPart(parts[i]),
        next,
        isArray;

      if (size - 1 != 0) {
        next = this.getPart(parts[i + 1]);
        isArray = next % 1 == 0;
      }

      if (obj[part] === undefined) {
        obj[part] = isArray ? [] : {};
      }

      obj = obj[part];
    }

    obj[this.getPart(parts[parts.length - 1])] = value;
  },

  clean: function (obj, path) {
    var parts = path.match(re);

    for (var i = 0, size = parts.length; i < size; i++) {
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (!exist(obj[part])) {
          delete obj[part];
          break;
        }
      }
    }
  },

  remove: function remove(obj, path) {

    var parts = path.match(re),
      last = this.getPart(parts.pop()),
      isExist = true;

    for (var i = 0, size = parts.length; i < size; i++) {
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (obj[part] != undefined) {
          obj = obj[part];
        } else {
          isExist = false;
          break;
        }
      } else {
        isExist = false;
        break;
      }
    }

    if (isExist) {
      if (last % 1 == 0) {
        obj.splice(last, 1);
      } else {
        delete obj[last];
      }
    }
  },

  map: function map(data, field) {
    if (!isArray(data) && field) {
      throw new Error('Map is available only for arrays');
    }

    var mapped = {};

    for (var i = 0, size = data.length; i < size; i++) {
      if (!data[i].hasOwnProperty(field)) {
        throw new Error('Map field ' + field + ' does not exist in the object');
      }

      mapped[data[i][field]] = data[i];
    }

    return mapped;
  },

  merge: function (a, b) {
    var merged = {},
      attr;
    for (attr in a) {
      if (a.hasOwnProperty(attr)) {
        merged[attr] = a[attr];
      }
    }
    for (attr in b) {
      if (b.hasOwnProperty(attr)) {
        merged[attr] = b[attr];
      }
    }
    return merged;
  },

  clone: function (obj) {
    var copy;

    if (null == obj || "object" != typeof obj) {
      return obj;
    }

    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy;
    }

    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj");
  },

  standalone: function(method){
    if (!this.hasOwnProperty(method)){
      throw new Error('Method does not exists');
    }

    return this[method].bind(this);
  }
};

module.exports = Mutators;

},{"./types":15}],13:[function(_dereq_,module,exports){
'use strict';

var Nests ={
  items: {},

  dig: function (key, config) {
    if (!this.items.hasOwnProperty(key)){
      this.items[key] = [];
    }

    this.items[key].push(config);
  },

  climb: function (key) {
    this.items[key].pop();
  },

  reset: function (key) {
    if (key){
      this.items[key] = [];
    } else {
      this.items = {};
    }
  },

  collect: function (key) {
    var results;

    if (key){
      results = this.items[key];
    } else {
      results = this.items;
    }

    return results || [];
  },

  merge: function(key){
    var items = this.collect(key),
      results = [];

    for (var i = 0, size = items.length; i < size; i++){
      results = results.concat(items[i]);
    }

    return results;
  }
};


module.exports = Nests;
},{}],14:[function(_dereq_,module,exports){
'use strict';


var Steps  = {
  path: [],

  back: function () {
   this.path.pop();
  },

  addKey: function (key) {
    this.path.push({
      value: key,
      type: 'key'
    });
  },

  addIndex: function (i) {
    this.path.push({
      value: i,
      type: 'index'
    });
  },

  clear: function () {
    this.path = [];
  },

  get: function (income) {
    var path = '',
      storage = income || this.path;

    for (var i = 0, size = storage.length; i < size; i++) {
      var item = storage[i];

      if (item.type == 'key') {
        if (i == 0) {
          path = item.value;
        } else {
          path += '.' + item.value;
        }
      } else if (item.type == 'index') {
        path += '[' + item.value + ']';
      }
    }

    return path;
  },

  isRoot: function(){
    return !this.path.length;
  }
};


module.exports = Steps;

},{}],15:[function(_dereq_,module,exports){
"use strict";

var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

var toString = Object.prototype.toString,
  arrayClass = '[object Array]',
  funcClass = '[object Function]';

var isObject = function(value) {
  return !!(value && objectTypes[typeof value]);
};

var isArray = function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == arrayClass || false;
};

var isString = function(value) {
  return typeof value === 'string';
};

var isNumber = function(value) {
  return typeof value === 'number';
};

var isDate = function(value) {
  return value instanceof Date;
};

var isBoolean = function(value) {
  return value === true || value === false;
};

var isFunction = function(value) {
  function F(value) {
    return typeof value == 'function';
  };

  if (F(/x/)) {
    F = function(value) {
      return typeof value == 'function' && toString.call(value) == funcClass;
    }
  }

  return F;
};

var exist = function(value) {
  var exist = false;
  if (value instanceof Date) {
    exist = true;
  } else if (isArray(value)) {
    exist = !!value.length;
  } else if (isObject(value)) {
    for (var i in value) {
      if (value.hasOwnProperty(i)) {
        exist = true;
        break;
      }
    }
  } else if (isString(value)) {
    exist = !!value.length;
  } else if (isNumber(value)) {
    exist = true;
  } else if (isBoolean(value)) {
    exist = true;
  } else if (value === null) {
    exist = true;
  }

  return exist;
};


module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  isNumber: isNumber,
  isBoolean: isBoolean,
  isDate: isDate,
  isFunction: isFunction(),
  exist: exist
};
},{}]},{},[1])
(1)
});