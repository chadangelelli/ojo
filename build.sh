#!/bin/sh

jison grammar.y lexer.l -o ojoparser.js
cat ojoparser.js ojointerpreter.js > ojo.js
