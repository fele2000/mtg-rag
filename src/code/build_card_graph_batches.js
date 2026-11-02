// Wraps card rows in Neo4j HTTP transaction bodies (UNWIND batches of 100).
const STATEMENT = __CYPHER_import_card_graph__;
const BATCH = 100;

const rows = $input.all().map(i => i.json);
const out = [];
for (let i = 0; i < rows.length; i += BATCH) {
  out.push({ json: { statements: [{ statement: STATEMENT, parameters: { rows: rows.slice(i, i + BATCH) } }] } });
}
return out;
