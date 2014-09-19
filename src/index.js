"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  isFunction = require('./utils/types').isFunction,
  isString = require('./utils/types').isString,
  exist = require('./utils/types').exist,
  Mutators = require('./utils/mutators'),
  Flow = require('./flow'),
  Conversions = require('./conversions');


var Path = {
  path: [],

  archive: [],
  glob: [],
  local: [],

  next: function () {
    if (this.path.length) {
      this.archive.push(this.path);
      this.clear();
    }
  },

  prev: function () {
    this.path = this.archive.pop() || [];
  },

  addKey: function (key) {
    this.path.push({
      value: key,
      type: 'key'
    });
  },

  removeLast: function () {
    this.path.pop();
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

  getGlobal: function () {
    var path = [];
    for (var i = 0, size = this.archive.length; i < size; i++) {
      path = path.concat(this.archive[i]);
    }

    path = path.concat(this.path);

    return this.get(path);
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
  }
};

function capitalize(str) {
  str = str.toLowerCase();
  return str.replace(/(\b)([a-zA-Z])/g,
    function (firstLetter) {
      return firstLetter.toUpperCase();
    });
}

function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function getRule(key, rules) {
  var rule = null;

  if (rules.hasOwnProperty('fields') && rules.fields.hasOwnProperty(key)) {
    var localRule = rules.fields[key];

    if (isObject(localRule)) {
      rule = localRule;
    }
  }

  return rule;
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

function parse(key, value, rules, obj, transformed) {

  var rule = getRule(key, rules);

  if (rule) {

    /**
     * Convert simple rename rule
     */
    if (!isObject(rule)) {
      rule = {
        rename: rule
      };
    }

    /**
     * Set default value
     */
    if (value === undefined && rule.hasOwnProperty('def')) {
      value = rule.def(obj);
    }

    /**
     * Set new key if rename option
     */
    if (rule.hasOwnProperty('rename')) {
      key = rule.rename;
    }

    /**
     * Convert value
     */
    if (rule.hasOwnProperty('convert')) {

      if (!isArray(rule.convert)) {
        rule.convert = [rule.convert];
      }


      for (var i = 0, size = rule.convert.length; i < size; i++) {
        var converter = rule.convert[i];

        if (isFunction(converter)) {
          value = converter(value, obj, transformed);

        } else if (isString(converter) || isObject(converter) || isArray(converter)) {
          var expr = converter,
            params = undefined;

          if (isArray(converter)) {
            expr = converter[0];
            params = converter[1];
          }

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

  for (var i = 0, size = rule.add.length; i < size; i++) {
    var added = rule.add[i](origin, transformed);

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

function resolve(origin, rule) {

  var keys;

  /**
   * Keys for transformed object
   */
  if (rule.type == 'select') {
    keys = Object.keys(rule.fields);
  } else {
    keys = Object.keys(origin)
      .concat(Object.keys(rule.fields))
      .filter(unique);
  }

  /**
   * Remove simple keys and collect complex
   */
//  var complex = [];
//  keys = keys.filter(function (key) {
//    var result = false;
//
//    if (key.indexOf('.') != -1 || key.indexOf('[') != -1){
//      complex.push(key);
//    } else {
//      result = rule.remove.indexOf(key) == -1;
//    }
//
//    return result;
//  });
//
//  console.log(keys);
//  console.log(complex);
//  xxx
  /**
   * Result object
   */
  var transformed = {},
    i, size;

  for (i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];

    Path.addKey(key);
//
//    console.log('                              ' + key);
//    console.log('Local');
//    console.log(Storage.get(), Path.get());
//    console.log(Storage.get().indexOf(Path.get()));
//
//    console.log('Global');
//    console.log(Storage.getGlobal(), Path.getGlobal());
//    console.log(Storage.getGlobal().indexOf(Path.getGlobal()));
//
//    console.log('---------------');



    if (Storage.getGlobal().indexOf(Path.getGlobal()) == -1
      && Storage.get().indexOf(Path.get()) == -1) {

//console.log(Path.getGlobal());
//    console.log(Path.getGlobal(),Path.get());

      /**
       * Get current value
       */
      var value = Mutators.get(origin, key, rule);

      /**
       * Apply rule if exists for child array or object elements
       */
//    if (key == 'friends'){
//      console.log(value);
//    }

      if (isArray(value) || isObject(value)) {
        var localRule = getRule(key, rule);


        if (localRule) {
          value = Mutate(value, localRule);
        }
      }

      /**
       * Get new key(if rename) and value (if default or converted)
       */
      var param = parse(key, value, rule, origin, transformed);

      if (exist(param.value)) {
        /**
         * Insert key, value to result object
         */
        Mutators.insert(transformed, param.key, param.value);

        /**
         * Clean empty arrays or objects that could appear after renaming.
         * NOTE: maybe this step is not needed after main loop is changed
         * and cloning of the origin object is removed
         */
        Mutators.clean(transformed, key);
      }
    }

    Path.removeLast();
  }

  /**
   * Add new values if described
   */
  if (rule.hasOwnProperty('add')) {
    add(transformed, rule, origin);
  }

//  if (!!complex.length){
//    for (i = 0, size = complex.length; i < size; i++){
//      Mutators.remove(transformed, complex[i]);
//    }
//  }

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

  if (rule.hasOwnProperty('add') && !isArray(rule.add)) {
    rule.add = [rule.add];
  }
}


var Storage = {
  items: [],

  add: function (items) {
    this.items.push(items);
  },

  getGlobal: function () {
    var total = [];

    for (var i = 0, size = this.items.length - 1; i < size; i++) {
      total = total.concat(this.items[i]);
    }

    return total;
  },

  get: function () {
    return this.items[this.items.length - 1];
  },

  pop: function () {
    this.items.pop();
  }
};

var Mutate = function (origin) {

  var obj = origin,
    rules = Array.prototype.slice.call(arguments, 1),
    i, size;


  for (i = 0, size = rules.length; i < size; i++) {
    Path.next();

    var rule = rules[i];

    if (!isObject(obj) || !isValid(rule)) {
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);


    if (!!rule.remove.length) {
      Storage.add(rule.remove);
    }

    var params;

    if (isArray(obj)) {
      var transformed = [];

      for (i = 0, size = obj.length; i < size; i++) {
        Path.addIndex(i);

        if (Storage.getGlobal().indexOf(Path.getGlobal()) == -1
          && Storage.get().indexOf(Path.get()) == -1) {
          transformed.push(
            resolve(obj[i], rule)
          );
        }

        Path.removeLast();
      }

      if (rule.hasOwnProperty('map')) {
        params = Mutators.map(transformed, rule.map);
      } else {
        params = transformed;
      }
    } else {
      params = resolve(obj, rule);
    }

    if (!rule.remove.length) {
      Storage.pop();
    }

    Path.prev();

    obj = params;
  }


  return obj;
};


Mutate.conversions = Conversions;
Mutate.addConversion = function (name, func) {

  if (Mutate.conversions.hasOwnProperty(name)) {
    console.log('Notice: Conversion already exist');
  }

  Mutate.conversions[name] = func;
};

/**
 * TODO: define flow as attribute instead of function
 */
Mutate.flow = function () {
  var flow = Flow();

  flow.onExec(function () {
    return Mutate.apply(null, arguments);
  });

  return flow;
};


module.exports = Mutate;