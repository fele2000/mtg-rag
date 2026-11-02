CALL db.index.vector.queryNodes('rule_chunk_embedding', $k, $embedding) YIELD node AS ch, score
MATCH (r:Rule)-[:HAS_CHUNK]->(ch)
OPTIONAL MATCH (r)<-[:DEFINED_BY]-(kw:Keyword)
OPTIONAL MATCH (kw)<-[:HAS_KEYWORD]-(c:Card)
WITH ch, score, r, kw, collect(DISTINCT c.name) AS cards
RETURN 'rule' AS kind, r.number + coalesce(' ' + r.title, '') AS name, ch.text AS text, round(score, 3) AS score,
       CASE WHEN kw IS NULL THEN [] ELSE ['Cards with ' + kw.name + ' (' + size(cards) + '): '] + cards[0..10] END AS related,
       ch.source AS source
UNION ALL
CALL db.index.vector.queryNodes('card_chunk_embedding', $k, $embedding) YIELD node AS ch, score
MATCH (c:Card)-[:HAS_CHUNK]->(ch)
OPTIONAL MATCH (c)-[:HAS_KEYWORD]->(kw:Keyword)
OPTIONAL MATCH (kw)-[:DEFINED_BY]->(r:Rule)
WITH c, ch, score, collect(DISTINCT kw.name + coalesce(' -> rule ' + r.number, '')) AS kws
RETURN 'card' AS kind, c.name AS name, ch.text AS text, round(score, 3) AS score,
       kws AS related, c.scryfall_uri AS source
