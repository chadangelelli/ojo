
id    [a-zA-Z_][a-zA-Z0-9_]{0,254}
str   ("'"("\\'"|[^"'"]|'"')*"'")|('"'('\\"'|[^'"']|"'")*'"')

%%

<<EOF>>   return "EOF";
"."       return "DOT";
"["       return "LBRACK";
"]"       return "RBRACK";
{id}      return "ID";
{str}     return "STR";
(0|[1-9][0-9]*)     return "INT";
