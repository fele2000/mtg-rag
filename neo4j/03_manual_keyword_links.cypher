// Normalisation: Scryfall keywords whose name does not match a rule title in 701/702.
// Run after both ingestion workflows (safe to re-run).
// Ability words (Landfall, Raid, Morbid, ...) are deliberately NOT linked: they have no rule of their own.
UNWIND [
  {k: 'Hexproof from', r: '702.11'},   // variant of Hexproof, defined in 702.11
  {k: 'Food',          r: '111.10'},   // predefined token, not a keyword ability
  {k: 'Treasure',      r: '111.10'}    // predefined token, not a keyword ability
] AS m
MATCH (k:Keyword {name: m.k}), (r:Rule {number: m.r})
MERGE (k)-[:DEFINED_BY]->(r)
RETURN k.name, r.number;
