MATCH (c:Card)
WHERE ($type IS NULL OR EXISTS { MATCH (c)-[:IS_TYPE]->(t:CardType) WHERE toLower(t.name) = toLower($type) })
  AND ($subtype IS NULL OR EXISTS { MATCH (c)-[:HAS_SUBTYPE]->(st:Subtype) WHERE toLower(st.name) = toLower($subtype) })
  AND ($keyword IS NULL OR EXISTS { MATCH (c)-[:HAS_KEYWORD]->(kw:Keyword) WHERE toLower(kw.name) = toLower($keyword) })
  AND ($min_mv IS NULL OR c.mana_value >= $min_mv)
  AND ($max_mv IS NULL OR c.mana_value <= $max_mv)
  AND (size($colors) = 0 OR ALL(x IN $colors WHERE EXISTS { MATCH (c)-[:HAS_COLOR]->(:Color {code: x}) }))
  AND (NOT $exact_colors OR COUNT { (c)-[:HAS_COLOR]->(:Color) } = size($colors))
  AND ($rarity IS NULL OR c.rarity = toLower($rarity))
  AND ($set IS NULL OR EXISTS { MATCH (c)-[:PRINTED_IN]->(s:Set) WHERE s.code = toLower($set) })
  AND ($format IS NULL OR EXISTS { MATCH (c)-[:LEGAL_IN]->(f:Format) WHERE f.name = toLower($format) })
  AND ($text IS NULL OR toLower(c.oracle_text) CONTAINS toLower($text))
WITH c ORDER BY c.mana_value, c.name
WITH collect(c) AS cards
RETURN size(cards) AS total_matches,
       [x IN cards[0..$limit] | {
          name: x.name, mana_cost: x.mana_cost, type_line: x.type_line,
          oracle_text: x.oracle_text, power: x.power, toughness: x.toughness,
          rarity: x.rarity, source: x.scryfall_uri
       }] AS cards
