'use strict';

var isObject = require('./utils/types').isObject,
  isFunction = require('./utils/types').isFunction,
  isArray = require('./utils/types').isArray,
  Map = require('./utils/mutators').map,
  Nests = require('./utils/nests');


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

    this.apply(key, source);
  },

  has: function (key) {
    return this.rules.hasOwnProperty(key);
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

  apply: function (name, Source) {
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