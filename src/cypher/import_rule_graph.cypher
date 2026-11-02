UNWIND $rows AS row
MERGE (s:Rule {number: row.section})
SET s.title = row.section_title, s.level = 'section'
MERGE (r:Rule {number: row.number})
SET r.title = row.title, r.section = row.section, r.level = 'rule', r.cr_version = row.cr_version
MERGE (r)-[:SUBRULE_OF]->(s)
