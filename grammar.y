%start ojo
%options flex
%%

ojo
  : path EOF { return $1; }
  ;

path
  : path DOT ID             { $$ = $1; $$.push(new  Name($3, loc(@1, @3))); }
  | path DOT INT            { $$ = $1; $$.push(new Slice($3, loc(@1, @3))); }
  | path LBRACK INT RBRACK  { $$ = $1; $$.push(new Slice($3, loc(@1, @4))); }
  | path LBRACK path RBRACK { $$ = $1; $$.push(new Slice($3, loc(@1, @4))); }
  | ID                      { $$ = [new Name($1, loc(@1, @1))]; }
  ;

%%

function loc(start, end) {
  return [end.first_column, end.last_column];
};

function Name(value, loc) {
  this.value = value;
  this.loc = loc;
}

function Slice(value, loc) {
  this.value = value;
  this.loc = loc;
}

parser.ast = {};
parser.ast.loc = loc;
parser.ast.Name = Name;
parser.ast.Slice = Slice;
