#!/usr/local/bin/node

if (typeof window !== 'undefined')
  alert("It is not wise to load Ojo's test script in a browser!");

var ojoparser = require('./ojoparser');
var Ojo = require('./ojo').Ojo;

String.prototype.intpol = function(o) {
  return this.replace(/{([^{}]*)}/g, function (a, b) {
    var r = o[b];
    return typeof r === 'string' || typeof r === 'number' ? r : a;
  });
};

JSON.dump = JSON.stringify;

function print() {
  Function.apply.call(console.log, console, arguments);
}

var ojo = new Ojo({ allowEval: true });

print('\n==================================================== parse tests:\n');

var parseTests = [
      'a.b.c',
      'aaa.bbb.c3',
      'a.b[0]',
      'a.b.0',
      'a.b[0].c',
      'a.b[c]',
      'a.b[c[d[e]]]',
      'a.b.c["12345b7e9012345a7fa01234"]',
      "a.b['c']",
    ]; 
var numTests = parseTests.length;
var res, expr, i, success;
var passed = 0;
var failed = 0;

for (i=0; i < numTests; i++) {
  expr = parseTests[i];

  try {
    res = ojo.parser.parse(expr);
    success = true;
    passed++;
  } catch (e) {
    res = e.message;
    success = false;
    failed++;
  }

  print('\ttest ' + (i+1) + ' .................. ' + (success ? 'OK' : 'FAIL!'));
  print('\t<=\t' + expr);
  print('\t=>\t' + JSON.dump(res));
  print(' ');
}

print("\n\tResult:\n\t\tpassed: " + passed + "\n\t\tfailed: " + failed + "\n");






print('\n==================================================== interpreter tests:\n');


if (typeof window === 'undefined')
  window = {};

window.x = 0;
window.y = 1;
window.z = 'c';

var testData = {
  a: {
    b: {
      c: [
        { d: 1 },
        { e: 2 },
        { "123456789012345678901234": 3 },
        { "testKey": 4 }
      ]
    }
  },
  x: ['a', 'b', 'c','c','c', 'd','d', 'e'],
  y: [1, 2, 3,3,3, 4,4, 5],
  z: ['a', 1, 'b', 2, 'c', 3,3,3, 'd','d', 4,4, 'e', 5, true, false, false],
  contacts: [
    { name: 'Alice', 
      email: 'alice@test.com',
      meta: {
        created: {
          date: '2012-03-20T01:11:01Z',
          user: {
            id: 1
          }
        }
      }
    },
    { name: 'Bob',
      email: 'bob@test.com',
      meta: {
        created: {
          date: '2013-04-20T00:00:00Z',
          user: {
            id: 2
          }
        }
      }
    },
    { name: 'Charlie',
      email: 'charlie@test.com',
      meta: {
        created: {
          date: '2014-01-01T11:01:01Z',
          user: {
            id: 3
          }
        }
      }
    }
  ]
};

print("\ttest data:\n", JSON.dump(testData, null, 4));
print("\n--------------------------------------------- >>\n");

var i, test, res, success;
var passed = 0;
var failed = 0;

var intepreterTests = [ 
  { fn: 'get', 
    needle: 'a', 
    haystack: testData, 
    match: testData.a
  },
  { fn: 'get', 
    needle: 'a.b',
    haystack: testData, 
    match: testData.a.b
  },
  { fn: 'get', 
    needle: 'a.b.c', 
    haystack: testData, 
    match: testData.a.b.c
  },
  { fn: 'get', 
    needle: 'a.b.c.0', 
    haystack: testData, 
    match: testData.a.b.c[0]
  },
  { fn: 'get', 
    needle: 'a.b.c[0]', 
    haystack: testData, 
    match: testData.a.b.c[0]
  },
  { fn: 'get', 
    needle: "a.b.c[2]['123456789012345678901234']", 
    haystack: testData, 
    match: testData.a.b.c[2]['123456789012345678901234']
  },
  { fn: 'get',
    needle: "a.b.c[3].testKey", 
    haystack: testData, 
    match: testData.a.b.c[3].testKey
  },
  { fn: 'filter',
    needle: 'x',
    haystack: testData,
    value: 'a',
    match: ['a']
  },
  { fn: 'filter',
    needle: 'x',
    haystack: testData,
    value: 'c',
    match: ['c', 'c', 'c']
  },
  { fn: 'filter',
    needle: 'z',
    haystack: testData,
    value: /c|3/,
    match: ['c', 3, 3, 3]
  },
  { fn: 'filter',
    needle: 'contacts',
    haystack: testData,
    key: 'name',
    value: 'Alice',
    match: [testData.contacts[0]]
  },
  { fn: 'filter',
    needle: 'contacts',
    haystack: testData,
    key: 'name',
    value: 'Charlie',
    match: [testData.contacts[2]]
  },
  { fn: 'filter',
    needle: 'contacts',
    haystack: testData,
    key: 'email',
    value: /test\.com$/,
    match: testData.contacts
  },
  { fn: 'filter',
    needle: 'contacts[0]',
    haystack: testData,
    key: 'name',
    value: 'Alice',
    match: testData.contacts[0]
  },
  { fn: 'filter',
    needle: 'z',
    haystack: testData,
    value: function(val) {
      return val == 'c' || val == 3;
    },
    match: ['c', 3, 3, 3]
  },
  { fn: 'filter',
    needle: 'contacts',
    haystack: testData,
    key: 'name',
    value: function(v) {
      return v === 'Alice';
    },
    match: [testData.contacts[0]]
  },
  { fn: 'filter',
    needle: 'contacts.0',
    haystack: testData,
    key: 'meta.created.date',
    value: /./,
    match: testData.contacts[0]
  },
  { fn: 'filter',
    needle: 'contacts[1]',
    haystack: testData,
    key: 'meta.created.date',
    value: '2013-04-20T00:00:00Z',
    match: testData.contacts[1]
  },
  { fn: 'filter',
    needle: 'contacts',
    haystack: testData,
    key: 'meta.created.date',
    value: function(d) {
      return d > '2013';
    },
    match: [testData.contacts[1], testData.contacts[2]]
  },
  { fn: 'filter',
    needle: 'a.b',
    haystack: testData,
    key: 'c.0.d',
    value: 1,
    match: testData.a.b
  }
]; // end tests

for (i=0, l=intepreterTests.length; i < l; i++) {
  test = intepreterTests[i]; 

  try {
    res = ojo.get(test.needle, test.haystack);
    if (test.fn == 'get') {
      res = ojo.result();
    } else if (test.fn == 'filter') {
      if (typeof test.key !== 'undefined') {
        res = ojo.filter(test.key, test.value).result();
      } else {
        res = ojo.filter(test.value).result();
      }
    }

    if (typeof res !== 'undefined' && JSON.dump(test.match) === JSON.dump(res)) {
      success = true;
      passed++;
    } else {
      success = false;
      failed++;
    }
  } catch (e) {
    res = e.message;
    success = false;
    failed++;
  }
 
  print('\t' + (success ? 'OK:   ' : 'FAIL:') + ' test ' + (i+1) + ' .................. ' + '(lookup algorithm: ' + ojo.algorithm + ') ');

  if (test.fn == 'get') {
    if (test.needle.indexOf('"') > -1)
      print("\t<=\tojo.get('{needle}', testData).result()".intpol(test));
    else
      print('\t<=\tojo.get("{needle}", testData).result()'.intpol(test));

  } else if (test.fn == 'filter') {
    var str = '';

    if (test.needle.indexOf('"') > -1)
      str += "\t<=\tojo.get('{needle}', testData)".intpol(test);
    else
      str += '\t<=\tojo.get("{needle}", testData)'.intpol(test);

    if (typeof test.key !== 'undefined') {
      if (test.value instanceof RegExp)
        str += '.filter("' + test.key + '", ' + test.value.toString() + ').result()';
      else if (typeof test.value === 'function')
        str += '.filter("' + test.key + '", __FUNCTION__).result()\n\t\t\t' 
          + test.value.toString().replace(/\n/g, '').replace(/ +/g, ' ');
      else
        str += '.filter("{key}", "{value}").result()'.intpol(test);
    } else {
      if (test.value instanceof RegExp)
        str += '.filter(' + test.value.toString() + ').result()';
      else if (typeof test.value === 'function')
        str += '.filter(__FUNCTION__).result()\n\t\t\t' + test.value.toString().replace(/\n/g, '').replace(/ +/g, ' ');
      else
        str += '.filter("{value}").result()'.intpol(test);
    }

    print(str);
  }

  print('\t=>\t' + JSON.dump(res));
  print(' ');
}

print("\n\tResult:\n\t\tpassed: " + passed + "\n\t\tfailed: " + failed + "\n");
