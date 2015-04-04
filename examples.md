# Ojo.js test examples

## command

    (env)m:ojo mako$ ./build.sh && ./test.js

## parse tests

    test 1 .................. OK
    <=	a.b.c
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"c","loc":[4,5]}]

    test 2 .................. OK
    <=	aaa.bbb.c3
    =>	[{"value":"aaa","loc":[0,3]},{"value":"bbb","loc":[4,7]},{"value":"c3","loc":[8,10]}]

    test 3 .................. OK
    <=	a.b[0]
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"0","type":"int","loc":[5,6]}]

    test 4 .................. OK
    <=	a.b.0
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"0","type":[4,5]}]

    test 5 .................. OK
    <=	a.b[0].c
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"0","type":"int","loc":[5,6]},{"value":"c","loc":[7,8]}]

    test 6 .................. OK
    <=	a.b[c]
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":[{"value":"c","loc":[4,5]}],"type":"path","loc":[5,6]}]

    test 7 .................. OK
    <=	a.b[c[d[e]]]
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":[{"value":"c","loc":[4,5]},{"value":[{"value":"d","loc":[6,7]},{"value":[{"value":"e","loc":[8,9]}],"type":"path","loc":[9,10]}],"type":"path","loc":[10,11]}],"type":"path","loc":[11,12]}]

    test 8 .................. OK
    <=	a.b.c["12345b7e9012345a7fa01234"]
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"c","loc":[4,5]},{"value":"12345b7e9012345a7fa01234","type":"str","loc":[32,33]}]

    test 9 .................. OK
    <=	a.b['c']
    =>	[{"value":"a","loc":[0,1]},{"value":"b","loc":[2,3]},{"value":"c","type":"str","loc":[7,8]}]


    Result:
      passed: 9
      failed: 0


## interpreter tests:

    test data:
    {
       "a": {
           "b": {
               "c": [
                   {
                       "d": 1
                   },
                   {
                       "e": 2
                   },
                   {
                       "123456789012345678901234": 3
                   },
                   {
                       "testKey": 4
                   }
               ]
           }
       },
       "x": [
           "a",
           "b",
           "c",
           "c",
           "c",
           "d",
           "d",
           "e"
       ],
       "y": [
           1,
           2,
           3,
           3,
           3,
           4,
           4,
           5
       ],
       "z": [
           "a",
           1,
           "b",
           2,
           "c",
           3,
           3,
           3,
           "d",
           "d",
           4,
           4,
           "e",
           5,
           true,
           false,
           false
       ],
       "contacts": [
           {
               "name": "Alice",
               "email": "alice@test.com"
           },
           {
               "name": "Bob",
               "email": "bob@test.com"
           },
           {
               "name": "Charlie",
               "email": "charlie@test.com"
           }
       ]
  	}

results:

	test 1 .................. OK (lookup algorithm: simple)
	<=	ojo.get("a", testData).results()
	=>	{"b":{"c":[{"d":1},{"e":2},{"123456789012345678901234":3},{"testKey":4}]}}

	test 2 .................. OK (lookup algorithm: simple)
	<=	ojo.get("a.b", testData).results()
	=>	{"c":[{"d":1},{"e":2},{"123456789012345678901234":3},{"testKey":4}]}

	test 3 .................. OK (lookup algorithm: loop)
	<=	ojo.get("a.b.c", testData).results()
	=>	[{"d":1},{"e":2},{"123456789012345678901234":3},{"testKey":4}]

	test 4 .................. OK (lookup algorithm: loop)
	<=	ojo.get("a.b.c.0", testData).results()
	=>	{"d":1}

	test 5 .................. OK (lookup algorithm: loop)
	<=	ojo.get("a.b.c[0]", testData).results()
	=>	{"d":1}

	test 6 .................. OK (lookup algorithm: loop)
	<=	ojo.get("a.b.c[2]['123456789012345678901234']", testData).results()
	=>	3

	test 7 .................. OK (lookup algorithm: loop)
	<=	ojo.get("a.b.c[3].testKey", testData).results()
	=>	4

	test 8 .................. OK (lookup algorithm: simple)
	<=	ojo.get("x", testData).filter("a").results()
	=>	["a"]

	test 9 .................. OK (lookup algorithm: simple)
	<=	ojo.get("x", testData).filter("c").results()
	=>	["c","c","c"]

	test 10 .................. OK (lookup algorithm: simple)
	<=	ojo.get("z", testData).filter(/c|3/).results()
	=>	["c",3,3,3]

	test 11 .................. OK (lookup algorithm: simple)
	<=	ojo.get("contacts", testData).filter("name", "Alice").results()
	=>	[{"name":"Alice","email":"alice@test.com"}]

	test 12 .................. OK (lookup algorithm: simple)
	<=	ojo.get("contacts", testData).filter("name", "Charlie").results()
	=>	[{"name":"Charlie","email":"charlie@test.com"}]

	test 13 .................. OK (lookup algorithm: simple)
	<=	ojo.get("contacts", testData).filter("email", /test\.com$/).results()
	=>	[{"name":"Alice","email":"alice@test.com"},{"name":"Bob","email":"bob@test.com"},{"name":"Charlie","email":"charlie@test.com"}]


	Result:
		passed: 13
		failed: 0
