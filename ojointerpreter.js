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
    if ( ! self.isServerSide)
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
      self.numResults    = 0;
    }; // end Ojo.initVars()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.get = function(needle, haystack) {
      if ( ! needle.length)
        throw new OjoError('Invalid Ojo needle "{needle}"'.intpol(self));

      // reset vars.
      self.initVars();
      // set specific values needed.
      self.needle = needle;
      self.haystack = haystack;
      self.components = needle.split('.');
      self.numComponents = self.components.length;

      // Simple lookup? (No nested variables.)
      if (needle.indexOf('[') === -1) { 
        if (self.numComponents < 3) {
          self.algorithm = 'simple';
          self.path = self.__simpleLookup(self.components, self.haystack);
        } else {
          self.algorithm = 'loop';
          self.path = self.__loopLookup(self.components, self.haystack);
        }

      } else if (/\[[a-zA-Z]/.test(self.needle)) { // Query has nested vars, use parser and/or eval.
        self.algorithm = 'advanced';

        /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         * This block is unfinished. 
         * Pushing to allow more basic features to be used.
         * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
         */
        throw new OjoError("Ojo Advanced algorithm unfinshed. Can't have nested vars yet!");

      } else { // No nested vars. Convert brackets to dot notation and call get()
        var _n = self.needle.replace(/[\]"']/g, '').replace('[', '.');
        self.get(_n, self.haystack);
      }

      return self;
    }; // end Ojo.get()

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.results = function() {
      return self.path;
    };

    // . .. ... .. . .. ... .. . .. ... .. . .. ... .. . .. ... .. .
    this.find = function(key_or_value, value) {
      var key, _isArr, _isObj, i, k, e, res;

      if (typeof value !== 'undefined')
        key = key_or_value;
      else
        value = key_or_value;

      if ( ! self.path)
        throw new OjoError('No result set for Find! Call Ojo.get first');

      _isObj = isObj(self.path);
      _isArr = ! _isObj && isArr(self.path);

      if ( ! _isArr && ! _isObj)
        throw new OjoError('Find requires an array or object');

      /*
      res = [];
      if (_isArr) {
        if (key) {
          if ( ! isObj(self.path[0]))
            throw new OjoError('key/value can only be passed to Find for an array of objects');

          // loop list
            // check if element is an object. throw error on false
        } else {
          i = 0;
          while (e = self.path[i]) {
            i++;
          }
        }
      } else { // _isObj
        print("OBJ");
      }
      */

      /*
      var path, target, i, k, e, res;
     
      path = self.get(needle, haystack, true);

      print('needle: ', needle);
      print('value: ', value);
      print('type: ', typeof path[0][path[1]]);
      jprint(path);
    
      if (path) {
        target = path[0][path[1]];
        if (isObj(target)) {
          print('OBJECT');
        } else if (isArr(target)) {
          print('ARRAY');
        } else {
          throw new OjoError('Find function only works on arrays and objects. ("{needle}")'.intpol(self));
        }
      }
      */

      return self;
    }; // end Ojo.find()
    
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
        if ( ! (c in path)) {
          path = undefined;
          break;
        }
        path = path[c];
        i++;
      }

      return path;
    }; // end Ojo.__loopLookup()

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
