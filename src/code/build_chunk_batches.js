// Upserts chunks with their embedding. Label and parent link depend on the chunk type.
const BASE = __CYPHER_import_chunks__;
const LABEL = { card: 'CardChunk', ruling: 'RulingChunk', rule: 'RuleChunk' };
const LINK = {
  card: 'MATCH (p:Card {oracle_id: row.parent_id}) MERGE (p)-[:HAS_CHUNK]->(ch)',
  ruling: 'MATCH (p:Card {oracle_id: row.parent_id}) MERGE (p)-[:HAS_RULINGS]->(ch)',
  rule: 'MATCH (p:Rule {number: row.parent_id}) MERGE (p)-[:HAS_CHUNK]->(ch)',
};
const BATCH = 50;

const byType = {};
for (const { json: c } of $input.all()) {
  (byType[c.source_type] ??= []).push({
    chunk_id: c.chunk_id, parent_id: c.parent_id, source_type: c.source_type,
    text: c.text, hash: c.hash, source: c.source, embedding: c.embedding,
  });
}

const out = [];
for (const [type, rows] of Object.entries(byType)) {
  const statement = BASE.replace('__LABEL__', LABEL[type]).replace('__LINK__', LINK[type]);
  for (let i = 0; i < rows.length; i += BATCH) {
    out.push({ json: { statements: [{ statement, parameters: { rows: rows.slice(i, i + BATCH) } }] } });
  }
}
return out;
