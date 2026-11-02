// One row per rule (chunks split into #1/#2 share the same Rule node).
const STATEMENT = __CYPHER_import_rule_graph__;
const BATCH = 200;

const byNumber = new Map();
for (const { json: c } of $input.all()) {
  if (!byNumber.has(c.number)) {
    byNumber.set(c.number, {
      number: c.number, section: c.section, section_title: c.section_title,
      title: c.title, cr_version: c.cr_version,
    });
  }
}
const rows = [...byNumber.values()];
const out = [];
for (let i = 0; i < rows.length; i += BATCH) {
  out.push({ json: { statements: [{ statement: STATEMENT, parameters: { rows: rows.slice(i, i + BATCH) } }] } });
}
return out;
