# Data

## Sources
| Source | What | How it is fetched | License / terms |
|---|---|---|---|
| [Scryfall API](https://scryfall.com/docs/api) | Card objects for the chosen set(s) | `/cards/search?q=(set:fdn)&unique=cards`, paginated | Scryfall API terms; card text © Wizards of the Coast |
| Scryfall rulings | Official rulings per card | `/cards/{id}/rulings` | same |
| [Comprehensive Rules](https://magic.wizards.com/en/rules) | Full rules text (TXT) | Downloaded by URL in workflow 01 | © Wizards of the Coast |

Ingested in this submission: set `fdn` (Foundations, 517 unique cards, 316 with rulings) and the Comprehensive Rules effective June 19, 2026 (1,169 rules, 146 sections).

## Samples (`sample/`)
Save these after the first run (n8n: click the node, copy output as JSON):
- `cards_sample.json`: 3-5 items from **Normalize cards**
- `chunks_sample.json`: 2 card chunks, 1 ruling chunk, 2 rule chunks (without the embedding array)
- `cr_sample.txt`: rule 702.19 Trample copied from the TXT

## Graph model

### Node labels
| Label | Key | Properties |
|---|---|---|
| Card | oracle_id | name, mana_cost, mana_value, type_line, oracle_text, power, toughness, loyalty, rarity, scryfall_uri |
| Set | code | name |
| Color | code (W/U/B/R/G) | name |
| Supertype | name | (Legendary, Basic, Snow, ...) |
| CardType | name | (Creature, Instant, ...) |
| Subtype | name | (Elf, Dragon, Aura, ...) |
| Keyword | name | (Flying, Trample, Scry, ...) |
| Format | name | (standard, modern, commander, ...) |
| Rule | number | title, level (`section` / `rule`), section, cr_version |
| Chunk (+ RuleChunk / CardChunk / RulingChunk) | id | text, source, source_type, hash, embedding (768 floats) |

### Relationships
```
(Card)-[:PRINTED_IN]->(Set)
(Card)-[:HAS_COLOR]->(Color)
(Card)-[:HAS_COLOR_IDENTITY]->(Color)
(Card)-[:HAS_SUPERTYPE]->(Supertype)
(Card)-[:IS_TYPE]->(CardType)
(Card)-[:HAS_SUBTYPE]->(Subtype)
(Card)-[:HAS_KEYWORD]->(Keyword)
(Card)-[:LEGAL_IN]->(Format)
(Keyword)-[:DEFINED_BY]->(Rule)
(Rule)-[:SUBRULE_OF]->(Rule)
(Card)-[:HAS_CHUNK]->(CardChunk)
(Card)-[:HAS_RULINGS]->(RulingChunk)
(Rule)-[:HAS_CHUNK]->(RuleChunk)
```

### Chunking
| Source | Chunk | Id |
|---|---|---|
| Card | name + cost + type line + oracle text + P/T + set | `card:<oracle_id>` |
| Rulings | all rulings for one card | `rulings:<oracle_id>` |
| Comprehensive Rules | one numbered rule incl. subrules and examples; split at 3500 chars | `rule:702.19` (`#1`, `#2` if split) |

The rules already have a useful structure (numbered rules), so they are chunked by structure instead of a fixed number of characters. A card is small and self-contained, so one card = one chunk.

### Duplicates and re-runs
- Every node is written with `MERGE` on a unique key, so re-running a workflow does not create duplicates.
- Each chunk stores a content hash (FNV-1a). Before embedding, the workflow asks Neo4j for existing hashes and only embeds new or changed chunks.
- Full reset: `neo4j/99_reset.cypher`, then `neo4j/02_seed.cypher`.

### Normalisation of keywords
Scryfall's `keywords` field mixes three kinds of things. 29 of 39 keywords matched a rule title in 701/702 automatically. The remaining 10 were reviewed by hand:

| Keyword(s) | What it is | Decision |
|---|---|---|
| Hexproof from | Variant of Hexproof | Linked to 702.11 (`neo4j/03_manual_keyword_links.cypher`) |
| Food, Treasure | Predefined tokens, not keyword abilities | Linked to 111.10 |
| Alliance, Ferocious, Formidable, Landfall, Morbid, Raid, Threshold | Ability words: labels with no rules meaning of their own | Not linked (documented limitation) |
