"use strict";

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  exist = require('./utils/types').exist,
  Mutators = require('./utils/mutators');


function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function parse(key, value, rule) {

  if (rule.fields.hasOwnProperty(key)){
    var field = rule.fields[key];

    if (value === undefined && field.hasOwnProperty('def')) {
      value = field.def();
    }

    if (field.hasOwnProperty('encode')) {
      value = field.encode(value);
    }

    if (field.hasOwnProperty('rename')) {
      key = field.rename;
    }
  }

  return {
    key: key,
    value: value
  };
}

function clone(obj) {

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    var copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}



function resolve(origin, rule) {

  var obj = clone(origin);

  var keys;
  if (rule.type == 'select'){
    keys = Object.keys(rule.fields);
  } else {
    keys = Object.keys(obj)
      .concat(Object.keys(rule.fields))
      .filter(unique);
  }

  for (var i = 0, size = rule.remove.length; i < size; i++){
    Mutators.remove(obj, rule.remove[i]);
  }

  var transformed = {};
  for (i = 0, size = keys.length; i < size; i++) {
    var key = keys[i];

      var value = Mutators.get(obj, key, rule),
        param = parse(key, value, rule);

      if (key != param.key) {
        //Mutators.remove(transformed, key);
      }

      if (exist(param.value)) {

        Mutators.insert(transformed, param.key, param.value);
        Mutators.clean(transformed, key);

        if (rule.fields.hasOwnProperty(key)) {
          var field = rule.fields[key];

//           console.log(field);
        }
      }
  }


  return transformed;
}

function isValid(rule){
  return !rule.hasOwnProperty('fields')
    || !rule.hasOwnProperty('exclude')
    || !['select', 'transform'].hasOwnProperty(rule.type);
}

function fillDefaults(rule){
  if (!rule.hasOwnProperty('remove')){
    rule.remove = [];
  }

  if (!rule.hasOwnProperty('type')){
    rule.type = 'transform';
  }

  if (!rule.hasOwnProperty('fields')) {
    rule.fields = {};
  }
}


module.exports = function transform(obj, rule){

    if (!isObject(obj) || !isValid(rule)){
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);

    var params;

    if (isArray(obj)){
      var transformed = [];

      for (var i = 0, size = obj.length; i < size; i++){
        transformed.push(
          resolve(obj[i], rule)
        );
      }

      if (rule.hasOwnProperty('map')){
        params = Mutators.map(transformed, rule.map);
      } else {
        params = transformed;
      }
    } else {
      params = resolve(obj, rule);
    }

    return params;
};