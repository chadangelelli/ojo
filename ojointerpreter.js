/*
  ojo.js
  2015-04-02

  author: Chad Angelelli <chad.angelelli@gmail.com>

  description:
    Ojo (spanish "eye") is a small interpreter for looking up variables by string. 
    It makes a few guesses about what it is asked to reference and attempts to optimize 
    the query either by manually looking up a variable in simple use cases, 
    or by running it through a parser for more advanced ones. 
    If that fails it can optionally attempt to eval() the string.
*/

(function(exports) { 
  'use strict';

  var _isServerSide = typeof require        !== 'undefined' &&
                      typeof module         !== 'undefined' &&
                      typeof module.exports !== 'undefined' ;

  // _______________________________________________________________
  function OjoError(message) {
    this.name = "OjoError";
    this.message = message;
  }
  OjoError.prototype = new Error();
  OjoError.prototype.constructor = OjoError;

  // _______________________________________________________________
  function Ojo(options) {
    var self = this;

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.isServerSide  = _isServerSide;
    this.isClientSide  = !_isServerSide;
    this.options       = options || {};

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    if (!self.isServerSide)
      this.parser = ojoparser;
    else if (typeof ojoparser !== 'undefined')
      this.parser = ojoparser;
    else
      this.parser = require('./ojoparser').parser;

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.needle;
    this.haystack;
    this.components;
    this.numComponents;
    this.algorithm;
    this.ir;
    this.path;
    this.resultSet;
    this.numResults;

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.initVars = function() {
      self.needle        = '';
      self.haystack      = {};
      self.components    = [];
      self.numComponents = 0;
      self.algorithm     = '';
      self.ir            = [];
      self.path          = undefined;
      self.resultSet     = [];
      self.numResults    = 0;
    }; // end Ojo.initVars()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.get = function(needle, haystack, _skipSettingResult) {
      var components, numComponents, algorithm, path, _n;

      if (!needle.length)
        throw new OjoError('Invalid Ojo needle "{needle}"'.intpol(self));

      components = needle.split('.');
      numComponents = components.length;

      // Simple lookup? (No nested variables.)
      if (needle.indexOf('[') === -1) { 
        if (numComponents < 3) {
          algorithm = 'simple';
          path = self.__simpleLookup(components, haystack);
        } else {
          algorithm = 'loop';
          path = self.__loopLookup(components, haystack);
        }

      } else if (/\[[a-zA-Z]/.test(needle)) { // Query has nested vars, use parser and/or eval.
        algorithm = 'advanced';

        /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         * This block is unfinished. 
         * Pushing to allow more basic features to be used.
         * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
         */
        throw new OjoError("Ojo Advanced algorithm unfinshed. Can't have nested vars yet!");

      } else { // No nested vars. Convert brackets to dot notation and call get()
        _n = needle.replace(/[\]"']/g, '').replace('[', '.');
        path = self.get(_n, haystack, true);
      }

      // internal call? return value.
      if (_skipSettingResult)
        return path;

      // reset vars.
      self.initVars();
      // set specific values needed.
      self.needle = needle;
      self.haystack = haystack;
      self.path = path;
      self.components = components; 
      self.numComponents = numComponents;
      self.algorithm = algorithm;

      if (!path)
        return;
      // else
      self.resultSet = self.path; 
      return self;
    }; // end Ojo.get()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.result = function() {
      return self.resultSet;
    };

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.filter = function(keyOrVal, val) {
      var key, _isArr, _isObj, res;

      if (!self.resultSet)
        throw new OjoError('No result set for Ojo.filter(). Call Ojo.get() first');

      _isObj = isObj(self.resultSet);
      _isArr = !_isObj && isArr(self.resultSet);

      if (!_isArr && !_isObj)
        throw new OjoError('Ojo.filter() requires an array or object');

      if (typeof val !== 'undefined')
        key = keyOrVal;
      else
        val = keyOrVal;

      if (_isArr) {
        if (typeof key === 'undefined')
          res = self.__filterArray(val); 
        else
          res = self.__filterArrayOfObjects(key, val);
      } else {
        res = self.__filterObject(key, val);
      }

      self.resultSet = res;
      return self;
    }; // end Ojo.filter()
    
    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.__simpleLookup = function(components, haystack) {
      var path;
 
      switch (components.length) {
      case 1:
        path = haystack[components[0]] || undefined;
        break;
      case 2:
        path = haystack[components[0]] || undefined;
        path = path ? path[components[1]] : undefined;
        break;
      }
 
      return path;
    }; // end Ojo.__simpleLookup()
 
    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.__loopLookup = function(components, haystack) {
      var i, c, path;

      i = 0;
      path = haystack;

      while (c = components[i]) {
        if (!(c in path)) {
          path = undefined;
          break;
        }
        path = path[c];
        i++;
      }

      return path;
    }; // end Ojo.__loopLookup()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.__filterArray = function(val) {
      var i, e, res;

      i = 0;
      res = [];
      if (val instanceof RegExp) {
        while (e = self.resultSet[i]) {
          if (val.test(e))
            res.push(e);
          i++;
        }
      } else if (typeof val === 'function') {
        while (e = self.resultSet[i]) {
          if (val(e))
            res.push(e);
          i++;
        }
      } else {
        while (e = self.resultSet[i]) {
          if (e == val)
            res.push(e);
          i++;
        }
      }

      if (res.length == 0)
        return;
      return res;
    } // end Ojo.__filterArray()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.__filterObject = function(key, val) {
      var set, target;

      set = self.resultSet;
      target = self.get(key, set, true);

      if (target) {
        if (val instanceof RegExp && val.test(target)) {
          return set;
        } else if (typeof val === 'function' && val(target)) {
          return set;
        } else if (target == val) {
          return set;
        }
      }
      return;
    } // end Ojo.__filterObject()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.__filterArrayOfObjects = function(key, val) {
      var i, e, target, res;

      if (!isObj(self.resultSet[0]))
        throw new OjoError('key/value can only be passed to Ojo.filter() for an array of objects');

      res = [];
      if (val instanceof RegExp) {
        i = 0;
        while (e = self.resultSet[i]) {
          if (!isObj(e))
            throw new OjoError('Invalid element at index ' + i + ' in Ojo.filter(). Must be object');
          target = self.get(key, e, true);
          if (key in e && val.test(target))
            res.push(e);
          i++;
        }
      } else if (typeof val === 'function') {
        i = 0;
        while (e = self.resultSet[i]) {
          target = self.get(key, e, true);
          if (val(target))
            res.push(e);
          i++;
        }
      } else {
        i = 0;
        while (e = self.resultSet[i]) {
          if (!isObj(e))
            throw new OjoError('Invalid element at index ' + i + ' in Ojo.filter(). Must be object');
          target = self.get(key, e, true);
          if (typeof target !== 'undefined' && target == val)
            res.push(e);
          i++;
        }
      }

      if (res.length == 0)
        return;
      return res;
    } // end Ojo.__filterArrayOfObjects()

  } // end Ojo()

  // _______________________________________________________________
  String.prototype.intpol = function(o) {
    return this.replace(/{([^{}]*)}/g, function (a, b) {
      var r = o[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
  }; 

  // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
  function isArr(v) { 
    return Object.prototype.toString.call(v) === '[object Array]'; 
  }

  // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
  function isObj(v)  { 
    return Object.prototype.toString.call(v) === '[object Object]'; 
  }

  // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
  function print() {
    Function.apply.call(console.log, console, arguments);
  }

  // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
  function jprint(x) {
    console.log(JSON.stringify(x, null, 4));
  }

  // _______________________________________________________________
  if (_isServerSide) {
    exports['Ojo'] = Ojo;
    exports['OjoError'] = OjoError;
  } else {
    window['Ojo'] = Ojo;
    window['OjoError'] = OjoError;
  }

}(typeof exports === 'undefined' ? {} : exports));
