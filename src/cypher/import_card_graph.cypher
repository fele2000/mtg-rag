UNWIND $rows AS row
MERGE (c:Card {oracle_id: row.oracle_id})
SET c.name = row.name, c.mana_cost = row.mana_cost, c.mana_value = row.mana_value,
    c.type_line = row.type_line, c.oracle_text = row.oracle_text,
    c.power = row.power, c.toughness = row.toughness, c.loyalty = row.loyalty,
    c.rarity = row.rarity, c.scryfall_uri = row.scryfall_uri
MERGE (s:Set {code: row.set_code}) SET s.name = row.set_name
MERGE (c)-[:PRINTED_IN]->(s)
FOREACH (x IN row.colors         | MERGE (n:Color {code: x})     MERGE (c)-[:HAS_COLOR]->(n))
FOREACH (x IN row.color_identity | MERGE (n:Color {code: x})     MERGE (c)-[:HAS_COLOR_IDENTITY]->(n))
FOREACH (x IN row.supertypes     | MERGE (n:Supertype {name: x}) MERGE (c)-[:HAS_SUPERTYPE]->(n))
FOREACH (x IN row.types          | MERGE (n:CardType {name: x})  MERGE (c)-[:IS_TYPE]->(n))
FOREACH (x IN row.subtypes       | MERGE (n:Subtype {name: x})   MERGE (c)-[:HAS_SUBTYPE]->(n))
FOREACH (x IN row.keywords       | MERGE (n:Keyword {name: x})   MERGE (c)-[:HAS_KEYWORD]->(n))
FOREACH (x IN row.legal_formats  | MERGE (n:Format {name: x})    MERGE (c)-[:LEGAL_IN]->(n))
