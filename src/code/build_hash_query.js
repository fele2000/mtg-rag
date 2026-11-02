// Duplicate check: ask Neo4j which chunks already exist and with which content hash.
const ids = $input.all().map(i => i.json.chunk_id);
return [{
  json: {
    statements: [{
      statement: 'MATCH (ch:Chunk) WHERE ch.id IN $ids RETURN ch.id AS id, ch.hash AS hash',
      parameters: { ids },
    }],
  },
}];
