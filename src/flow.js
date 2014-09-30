'use strict';

var isArray = require('./utils/types').isArray,
  isObject = require('./utils/types').isObject,
  Mutators = require('./utils/mutators');

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
    pushQueue();
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
