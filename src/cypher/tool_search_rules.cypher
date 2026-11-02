CALL () {
  CALL db.index.vector.queryNodes('rule_chunk_embedding', $k, $embedding) YIELD node, score
  RETURN node, score
  UNION ALL
  CALL db.index.vector.queryNodes('ruling_chunk_embedding', $k, $embedding) YIELD node, score
  RETURN node, score
}
RETURN node.source_type AS kind, node.text AS text, round(score, 3) AS score, node.source AS source
ORDER BY score DESC
LIMIT $k
