MATCH (c:Card) WHERE toLower(c.name) CONTAINS toLower($name)
WITH c ORDER BY CASE WHEN toLower(c.name) = toLower($name) THEN 0 ELSE 1 END, size(c.name)
LIMIT 1
OPTIONAL MATCH (c)-[:HAS_KEYWORD]->(k:Keyword)
OPTIONAL MATCH (k)-[:DEFINED_BY]->(r:Rule)-[:HAS_CHUNK]->(rch:RuleChunk)
WITH c, collect(DISTINCT {keyword: k.name, rule: r.number, rule_text: left(rch.text, 900)}) AS kws
OPTIONAL MATCH (c)-[:HAS_RULINGS]->(rc:RulingChunk)
OPTIONAL MATCH (c)-[:PRINTED_IN]->(s:Set)
OPTIONAL MATCH (c)-[:LEGAL_IN]->(f:Format)
RETURN c.name AS name, c.mana_cost AS mana_cost, c.mana_value AS mana_value, c.type_line AS type_line,
       c.oracle_text AS oracle_text, c.power AS power, c.toughness AS toughness,
       [x IN kws WHERE x.keyword IS NOT NULL] AS keywords,
       rc.text AS rulings,
       collect(DISTINCT s.name) AS sets,
       collect(DISTINCT f.name) AS legal_in,
       c.scryfall_uri AS source
