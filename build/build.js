!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.mutate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

var types = _dereq_('./utils/types');

function checkType(checkKey, value) {
  var check = types[checkKey];

  if (!check(value)) {
    throw new TypeError('Type check failed: ' + checkKey + '(' + JSON.stringify(value) + ')');
  }
}

var Conversions = {
  toJSON: function(value) {
    return JSON.stringify(value);
  },

  Number_To_String: function(value) {
    checkType('isNumber', value);
    return value.toString();
  },

  Number_To_Boolean: function(value) {
    checkType('isNumber', value);
    return !!value;
  },

  Number_To_Date: function(value) {
    checkType('isNumber', value);
    return new Date(value);
  },

  String_To_Integer: function(value) {
    checkType('isString', value);
    return parseInt(value, 10);
  },

  String_To_Number: function(value) {
    checkType('isString', value);
    return parseFloat(value, 10);
  },

  String_To_Date: function(value) {
    checkType('isString', value);
    return new Date(Date.parse(value));
  },

  Date_To_String: function(value) {
    checkType('isDate', value);
    return '' + value;
  },

  Boolean_To_Integer: function(value) {
    checkType('isBoolean', value);
    return +value;
  },
};



module.exports = Conversions;
},{"./utils/types":5}],2:[function(_dereq_,module,exports){
"use strict";

var isArray = _dereq_('./utils/types').isArray,
  isObject = _dereq_('./utils/types').isObject,
  isFunction = _dereq_('./utils/types').isFunction,
  isString = _dereq_('./utils/types').isString,
  exist = _dereq_('./utils/types').exist,
  Mutators = _dereq_('./utils/mutators'),
  Flow = _dereq_('./flow'),
  Conversions = _dereq_('./conversions');

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
  }

  add(transformed, rule, origin);

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


Mutate.conversions = Conversions;
Mutate.addConversion = function(name, func) {

  if (Mutate.conversions.hasOwnProperty(name)) {
    console.log('Notice: Converion already exist');
  }

  Mutate.conversions[name] = func;
}

Mutate.flow = function() {
  var flow = Flow()
  flow.onExec(function() {
    return Mutate.apply(null, arguments);
  });
  return flow;
};


module.exports = Mutate;
},{"./conversions":1,"./flow":3,"./utils/mutators":4,"./utils/types":5}],3:[function(_dereq_,module,exports){
"use strict";

function getFlow() {

  var rules = {},
    queue = [],
    current = [],
    onExec,
    AVAILABLE_TYPES = ['transform', 'select'];

  function initRules() {
    rules = {
      fields: {}
    }
  }

  function isEmpty() {

    var isExists = false;
    for (var field in rules.fields) {
      if (rules.fields.hasOwnProperty(field)) {
        isExists = true;
        break;
      }
    }

    var isRemoveEmpty = !rules.hasOwnProperty('remove') || rules.remove.length == 0;

    return isRemoveEmpty && !isExists;
  }

  function setType(type) {
    if (AVAILABLE_TYPES.indexOf(type) == -1) {
      throw new Error('Unssported tranform type');
    }

    rules.type = type;
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

  function addField(field) {
    if (!rules.fields.hasOwnProperty(field)) {
      rules.fields[field] = {};
    }
  }

  function convertField(expression, params) {
    var rule = getRule();

    if (!rule.hasOwnProperty('convert')) {
      rule.convert = [];
    }

    rule.convert.push([expression, params]);
  }

  function renameField(name) {
    getRule().rename = name;
  }

  function mapArray(key) {
    getRule().map = key;
  }

  function removeField() {
    var field = getField(),
      rules = getRule(1);

    if (!rules.hasOwnProperty('remove')) {
      rules.remove = [];
    }

    rules.remove.push(field);
    if (rules.fields.hasOwnProperty(field)) {
      delete rules[field];
    }
  }

  function setDef(def) {
    getRule().def = def;
  }

  function setEncode(encode) {
    getRule().encode = encode;
  }

  function add(func) {
    if (!rules.hasOwnProperty('add')) {
      rules.add = [];
    }

    rules.add.push(func);
  }

  function isCurrentSelected() {
    if (!current) {
      throw new Error('Select field before actions');
    }
  }

  function selectField(field) {
    current = [field];
  }

  function selectChild(field) {
    current.push(field);
  }

  function pushQueue() {
    queue.push(rules);
  }

  initRules();

  var Flow = function(source) {
    if (!onExec) {
      throw new Error('Shoule be defined on exec funciton');
    }

    var queue = Flow.getQueue();

    return onExec.apply(null, [source].concat(queue));
  };

  Flow.onExec = function(on) {
    onExec = on;
  };

  Flow.getQueue = function() {
    if (!isEmpty()) {
      Flow.then();
    }

    return queue;
  };

  Flow.field = function(field) {
    addField(field);
    selectField(field);
    return this;
  };

  Flow.child = function(field) {
    selectChild(field);
    return this;
  };

  Flow.remove = function() {
    isCurrentSelected();
    removeField();
    return this;
  };

  Flow.rename = function(name) {
    renameField(name);
    return this;
  };

  Flow.map = function(key) {
    mapArray(key);
    return this;
  };

  Flow.then = function() {
    pushQueue();
    initRules();
    return this;
  };

  Flow.convert = function(expression, params) {
    convertField(expression, params);
    return this;
  };

  Flow.def = function(value) {
    setDef(value);
    return this;
  };

  Flow.type = function(type) {
    setType(type);
    return this;
  };

  Flow.add = function(func) {
    add(func);
    return this;
  };

  return Flow;
}

module.exports = getFlow;
},{}],4:[function(_dereq_,module,exports){
'use strict';
var isArray = _dereq_('./types').isArray,
  exist = _dereq_('./types').exist,
  re = /(\w+)|(\[\d+\])/g;

module.exports = {

  getPart: function getPart(key){
    var sliced = key.slice(1).slice(0, -1);

    if (key[0] == '[' && key[key.length - 1] == ']' && sliced % 1 == 0){
      key = sliced;
    }

    return key;
  },

  get: function get(obj, path){
    var parts = path.match(re),
      current = obj;

    for (var i = 0, size = parts.length; i < size; ++i) {
      var part = this.getPart(parts[i]);

      if(current[part] === undefined) {
        return undefined;
      } else {
        current = current[part];
      }
    }

    return current;
  },

  insert: function insert(obj, key, value){
    var parts = key.match(/(\w+)|(\[\d+\])/g);

    for (var i = 0, size = parts.length; i < size - 1; i++) {
      var part = this.getPart(parts[i]),
        next,
        isArray;

      if (size - 1 != 0){
        next = this.getPart(parts[i + 1]);
        isArray = next % 1 == 0;
      }

      if (obj[part] === undefined){
        obj[part] = isArray ? [] : {};
      }

      obj = obj[part];
    }

    obj[this.getPart(parts[parts.length - 1])] = value;
  },

  clean: function(obj, path){
    var parts = path.match(re);

    for (var i = 0, size = parts.length; i < size; i++){
      var part = this.getPart(parts[i]);

      if (obj.hasOwnProperty(part)) {
        if (!exist(obj[part])) {
          delete obj[part];
          break;
        }
      }
    }
  },

  remove: function remove(obj, path){

    var parts = path.match(re),
      last = this.getPart(parts.pop()),
      isExist = true;

    for (var i = 0, size = parts.length; i < size; i++){
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

    if (isExist){
      if (last % 1 == 0){
        obj.splice(last, 1);
      } else {
        delete obj[last];
      }
    }
  },

  map: function map(data, field){
    if (!isArray(data) && field){
      throw new Error('Map is available only for arrays');
    }

    var mapped = {};

    for (var i = 0, size = data.length; i < size; i++){
      if (!data[i].hasOwnProperty(field)){
        throw new Error('Map field does not exist in the object');
      }    

      mapped[data[i][field]] = data[i];
    }

    return mapped;
  }
};
},{"./types":5}],5:[function(_dereq_,module,exports){
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
},{}]},{},[2])
(2)
});