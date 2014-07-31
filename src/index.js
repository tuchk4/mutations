"use strict";

var Utils = require('./utils/include'),
  Types = {
    select: require('./types/select'),
    transform: require('./types/transform')
  };

function isExcluded(key, rule){
  return rule.exclude.indexOf(key) != -1;
}

function selectParam(key, value, rule) {

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

function insert(obj, key, value){
  var parts = key.split('.'),
    last = parts.pop();


  for (var i = 0, size = parts.length; i < size; i++){
    if (obj[parts[i]] === undefined){
      obj[parts[i]] = {};
    }

    obj = obj[parts[i]];
  }

  if (!Utils.types.isObject(obj)){
    throw new Error('Invalid rename property or last obj element is not obj or arr');
  }


  obj[last] = value;
}


function remove(obj, path){
  var dots = path.split('.'),
    last = dots.pop(),
    isExist = true;

  for (var i = 0, size = dots.length; i < size; i++){
    if (obj.hasOwnProperty(dots[i])) {
      if (obj[dots[i]] != undefined) {
        obj = obj[dots[i]];
      } else {
        isExist = false;
      }
    } else {
      isExist = false;
    }
  }

  if (isExist){
    delete obj[last];
  }
}

function get(obj, path){
  var dots = path.split('.'),
    current = obj;

  for (var i = 0, size = dots.length; i < size; ++i) {
    if (current.hasOwnProperty(dots[i])) {
      if(current[dots[i]] === undefined) {
        return undefined;
      } else {
        current = current[dots[i]];
      }
    }
  }
  return current;
}

function resolve(object, rule) {
  var resolver = Types[rule.type];

  var transformed = {};

  for (var key in object){
    if (object.hasOwnProperty(key) && !resolver.isExcluded(key, rule) && !isExcluded(key, rule)){
      var param = selectParam(key, object[key], rule);
      insert(transformed, param.key, param.value);
    }
  }

  for (var path in rule.fields){
    if (rule.fields.hasOwnProperty(path)){
      var dots = path.split('.');

      if (dots.length > 1){
        var value = get(object, path),
          param = selectParam(path, value, rule);

        if (path != param.key) {
          remove(transformed, path);
        }

        insert(transformed, param.key, param.value);
      }
    }
  }

  return transformed;
}

function isValid(rule){
  return !rule.hasOwnProperty('type')
    || !rule.hasOwnProperty('fields')
    || !rule.hasOwnProperty('exclude')
    || !Types.hasOwnProperty(rule.type);
}

function fillDefaults(rule){
  if (!rule.hasOwnProperty('exclude')){
    rule.exclude = [];
  }

  if (!rule.hasOwnProperty('type')){
    rule.type = 'transform';
  }

  if (!rule.hasOwnProperty('fields')){
    rule.fields = {};
  }
}


module.exports = function transform(object, rule){

    if (!Utils.types.isObject(object) || !isValid(rule)){
      throw new Error('Invalid parameters');
    }

    fillDefaults(rule);

    var params = [];

    if (Utils.types.isArray(object)){
      for (var i = 0, size = object.length; i < size; i++){
        var transformed = resolve(object[i], rule);
        params.push(transformed);
      }
    } else {
      params = resolve(object, rule);
    }

    return params;
};