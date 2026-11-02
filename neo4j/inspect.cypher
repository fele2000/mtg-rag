// Handy checks after ingestion

// Node counts per label
CALL db.labels() YIELD label
CALL (label) { MATCH (n) WHERE label IN labels(n) RETURN count(n) AS n }
RETURN label, n ORDER BY n DESC;

// Relationship counts per type
MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS n ORDER BY n DESC;

// Keywords that did NOT get linked to a rule (ability words like Landfall are expected here)
MATCH (k:Keyword) WHERE NOT (k)-[:DEFINED_BY]->() RETURN k.name ORDER BY k.name;

// Index status
SHOW VECTOR INDEXES;

// Visual sample for screenshots
MATCH p = (c:Card)-[:HAS_KEYWORD]->(:Keyword)-[:DEFINED_BY]->(:Rule)-[:SUBRULE_OF]->(:Rule)
RETURN p LIMIT 15;
