// Run after 01_setup.cypher (schema and data cannot share a transaction).
UNWIND [
  {code: 'W', name: 'White'}, {code: 'U', name: 'Blue'}, {code: 'B', name: 'Black'},
  {code: 'R', name: 'Red'},   {code: 'G', name: 'Green'}
] AS c
MERGE (col:Color {code: c.code})
SET col.name = c.name;
