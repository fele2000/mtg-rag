MATCH (k:Keyword)
MATCH (r:Rule {level: 'rule'})
WHERE r.section IN ['701', '702'] AND toLower(r.title) = toLower(k.name)
MERGE (k)-[:DEFINED_BY]->(r)
RETURN count(*) AS linked
