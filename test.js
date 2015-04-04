#!/usr/local/bin/node

var ojoparser = require('./ojoparser');
var Ojo = require('./ojo').Ojo;

function print() {
  Function.apply.call(console.log, console, arguments);
}

var ojo = new Ojo({ allowEval: true });

print('\n==================================================== parse tests:\n');

var parse_tests = [
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
var num_tests = parse_tests.length;
var res, expr, i, success;
var passed = 0;
var failed = 0;

for (i=0; i < num_tests; i++) {
  expr = parse_tests[i];

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
  print('\t=>\t' + JSON.stringify(res));
  print(' ');
}

print("\n\tResult:\n\t\tpassed: " + passed + "\n\t\tfailed: " + failed + "\n");






print('\n==================================================== interpreter tests:\n');

if (typeof window === 'undefined')
  window = {};

window.x = 0;
window.y = 1;
window.z = 'c';

var test_data = {
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
    { name: 'alice'  , email: 'alice@test.com'   },
    { name: 'bob'    , email: 'bob@test.com'     },
    { name: 'charlie', email: 'charlie@test.com' }
  ]
};

var i, test, res, success;
var passed = 0;
var failed = 0;

var intepreter_tests = [ 
  { fn: 'get', 
    needle: 'a', 
    haystack: test_data, 
    match: test_data.a
  },
  { fn: 'get', 
    needle: 'a.b',
    haystack: test_data, 
    match: test_data.a.b
  },
  { fn: 'get', 
    needle: 'a.b.c', 
    haystack: test_data, 
    match: test_data.a.b.c
  },
  { fn: 'get', 
    needle: 'a.b.c.0', 
    haystack: test_data, 
    match: test_data.a.b.c[0]
  },
  { fn: 'get', 
    needle: 'a.b.c[0]', 
    haystack: test_data, 
    match: test_data.a.b.c[0]
  },
  { fn: 'get', 
    needle: "a.b.c[2]['123456789012345678901234']", 
    haystack: test_data, 
    match: test_data.a.b.c[2]['123456789012345678901234']
  },
  { fn: 'get',
    needle: "a.b.c[3].testKey", 
    haystack: test_data, 
    match: test_data.a.b.c[3].testKey
  },
  { fn: 'find',
    needle: 'x',
    haystack: test_data,
    value: 'a',
    match: ['a']
  }
];

for (i=0, l=intepreter_tests.length; i < l; i++) {
  test = intepreter_tests[i]; 

  try {
    res = ojo.get(test.needle, test.haystack);
    if (test.fn == 'get') {
      res = ojo.results();
    } else if (test.fn == 'find') {
      if (typeof test.key !== 'undefined') {
        res = ojo.find(test.key, test.value).results();
      } else {
        res = ojo.find(test.value).results();
      }
    }

    if (typeof res !== 'undefined' && JSON.stringify(test.match) === JSON.stringify(res)) {
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
 
  print('\ttest ' + (i+1) + ' .................. ' + (success ? 'OK' : 'EPIC FAIL!') + ' (algorithm: ' + ojo.algorithm + ') ');

  if (test.fn == 'get') {
    print('\t<=\tget() -> "' + test.needle + '" in ' + JSON.stringify(test.haystack));

  } else if (test.fn == 'find') {
    if (typeof test.key !== 'undefined') {
      print('\t<=\tfind() -> (' + test.needle + ' -> ' + test.key + ' == ' + test.value + ') in ' + JSON.stringify(test.haystack));
    } else {
      print('\t<=\tfind() -> (' + test.needle + ' has "' + test.value + '") in ' + JSON.stringify(test.haystack));
    }
  }

  print('\t=>\t' + JSON.stringify(res));
  print(' ');
}

print("\n\tResult:\n\t\tpassed: " + passed + "\n\t\tfailed: " + failed + "\n");
