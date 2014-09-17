"use strict";

function getFlow() {

  var rules = {},
    queue = [],
    current = [],
    onExec,
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

  function addField(field) {  
    if (!rules.fields.hasOwnProperty(field)) {
      rules.fields[field] = {};
    }
  }

  function convertField(expression, params) {
    var rule = getRule();

    if (!rule.hasOwnProperty('convert')){
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

  function add(func){
    if (!rules.hasOwnProperty('add')){
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

module.exports = getFlow();