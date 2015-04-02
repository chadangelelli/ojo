#!/bin/sh

jison grammar.y lexer.l -o ojoparser.js
node test.js
