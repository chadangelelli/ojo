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
  }
};

var tests = [
  ['get', 'a', test_data, test_data.a],
  ['get', 'a.b', test_data, test_data.a.b],
  ['get', 'a.b.c', test_data, test_data.a.b.c],
  ['get', 'a.b.c.0', test_data, test_data.a.b.c[0]],
  ['get', 'a.b.c[0]', test_data, test_data.a.b.c[0]],
  ['get', "a.b.c[2]['123456789012345678901234']", test_data, test_data.a.b.c[2]['123456789012345678901234']],
  ['get', "a.b.c[3].testKey", test_data, test_data.a.b.c[3].testKey],
  ['get', 'a.b[z].d', test_data, test_data.a.b.c.d]
];
var i, test, res, success;
var passed = 0;
var failed = 0;

for (i=0, l=tests.length; i < l; i++) {
  test = tests[i]; 
  test = { 
    fn      : test[0], 
    needle  : test[1],
    haystack: test[2],
    match   : test[3],
    value   : test[4] || null 
  };

  try {
    res = ojo[test.fn](test.needle, test.haystack);
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
 
  print('\ttest ' + (i+1) + ' .................. ' + (success ? 'OK' : 'FAIL!') + ' (algorithm: ' + ojo.algorithm + ') ');

  print('\t<=\tget "' + test.needle + '" in ' + JSON.stringify(test.haystack));
  print('\t=>\t' + JSON.stringify(res));
  print(' ');
}

print("\n\tResult:\n\t\tpassed: " + passed + "\n\t\tfailed: " + failed + "\n");
