!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.mutate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function getFlow() {

  var rules = {},
    queue = [],
    current = [],
    onExec,
    temp = {},
    AVAILABLE_TYPES = ['transform', 'select'];

  function initRules() {
    rules = {
      remove: [],
      fields: {},
      type: 'transform'
    }
  }

  function isEmpty(local) {
    local = local || rules;

    var isExists = false;
    for (var field in local.fields) {
      if (local.fields.hasOwnProperty(field)) {
        isExists = true;
        break;
      }
    }

    return rules.remove.length == 0 && !isExists;
  }

  function capitalize(str) {
    str = str.toLowerCase();
    return str.replace(/(\b)([a-zA-Z])/g,
      function(firstLetter) {
        return firstLetter.toUpperCase();
      });
  }

  function setType(type) {
    if (AVAILABLE_TYPES.indexOf(type) == -1) {
      throw new Error('Unssported tranform type');
    }

    rules.type = type;
  }

  function getRule(d) {
    var obj = rules;

    if (arguments.length == 0){
      d = 0;
    } 

    for (var i = 0, size = current.length - d; i < size; i++) {
      var field = current[i];
      if (!obj.hasOwnProperty('fields')){
        obj.fields = {};
      }

      if (!obj.fields.hasOwnProperty(field)){
        obj.fields[field] = {};
      }

      obj = obj.fields[field];
    }

    return obj;
  }

  function getField() {
    return current[current.length - 1];
  }

  function calcTransformFunc() {
    var field = getField();

    var to = temp[field].to_type;
    var from = temp[field].from_type;

    if (to && from) {
      var type = capitalize(to) + '_To_' + capitalize(from);
      transformField(type);
    }
  }

  function setFromType(type) {
    var field = getField();

    if (!temp.hasOwnProperty(field)) {
      temp[field] = {};
    }

    temp[field].from_type = type;
    calcTransformFunc();
  }

  function setToType(type) {
    var field = getField();

    if (!temp.hasOwnProperty(field)) {
      temp[field] = {};
    }

    temp[field].to_type = type;
    calcTransformFunc();
  }

  function addField(field) {  
    if (!rules.fields.hasOwnProperty(field)) {
      rules.fields[field] = {};
    }
  }

  function transformField(key) {
    getRule().transform = key;
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

    if (!rules.hasOwnProperty('remove')){
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
    if (!isEmpty()) {
      Flow.then();
    }

    if (!onExec) {
      throw new Error('Shoule be defined on exec funciton');
    }

    return onExec.apply(null, [source].concat(queue));
  };

  Flow.onExec = function(on) {
    onExec = on;
  };

  Flow.getQueue = function() {
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

  Flow.transform = function(key) {
    transformField(key);
    return this;
  };

  Flow.fromType = function(type) {
    setFromType(type);
    return this;
  };

  Flow.toType = function(type) {
    setToType(type);
    return this;
  };

  Flow.def = function(value) {
    setDef(value);
    return this;
  };

  Flow.encode = function(encode) {
    setEncode(encode);
    return this;
  };

  Flow.type = function(type) {
    setType(type);
    return this;
  };

  return Flow;
}

module.exports = getFlow();
},{}],2:[function(require,module,exports){
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
},{"./flow":1,"./utils/mutators":3,"./utils/types":4}],3:[function(require,module,exports){
'use strict';
var isArray = require('./types').isArray,
  exist = require('./types').exist,
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
},{"./types":4}],4:[function(require,module,exports){
"use strict";

var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

var toString = Object.prototype.toString;
var arrayClass = '[object Array]';

var isObject = function(value){
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

var isBoolean = function(value){
  return value === true || value === false;
};

var exist = function(value){
  var exist = false;
  if (value instanceof Date){
    exist = true;
  } else if (isArray(value)){
    exist = !!value.length;
  } else if (isObject(value)){
    for (var i in value){
      if (value.hasOwnProperty(i)){
        exist = true;
        break;
      }
    }
  } else if (isString(value)) {
    exist = !!value.length;
  } else if (isNumber(value)){
    exist = true;
  } else if (isBoolean(value)){
    exist = true;
  } else if (value === null){
    exist = true;
  }

  return exist;
};


module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  isNumber: isNumber,
  exist: exist
};
},{}]},{},[2])(2)
});