CALL db.index.vector.queryNodes('card_chunk_embedding', $k, $embedding) YIELD node, score
MATCH (c:Card)-[:HAS_CHUNK]->(node)
RETURN c.name AS name, node.text AS text, round(score, 3) AS score, c.scryfall_uri AS source
ORDER BY score DESC
