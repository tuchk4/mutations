'use strict';

var Types = require('../utils/types');


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


function err(checkKey, value){
  throw new TypeError('Type check failed: ' + checkKey + '(' + JSON.stringify(value) + ')');
}

function checkType(checkKey, value) {
  var check = Types[checkKey];

  if (!check(value)) {
    err(checkKey, value);
  }
}

var conversions =  {
  Any_To_Json: function(value) {
    return JSON.stringify(value);
  },

  Array_To_Json: function(value) {
    checkType('isArray', value);
    return this.Any_To_Json(value);
  },

  Object_To_Json: function(value) {
    if (!Types.isObject(value) || Types.isArray(value)){
      err('isObject and !isArray', value);
    }
    return this.Any_To_Json(value);
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
          params = converter[1];
        }

        var type;
        if (Types.isObject(expr)) {

          type = getType(expr);
        } else {
          type = expr;
        }

        if (conversions.hasOwnProperty(type)) {
          converted = conversions[type].call(null, converted, origin, params);
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

      if (Types.isFunction(expr)){
        Rule.convert.push(expr);
      } else {
        Rule.convert.push([expr, params]);
      }
    }
  }
};

