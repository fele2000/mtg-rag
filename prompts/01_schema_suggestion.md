# Prompt used to let an AI suggest the graph schema

The schema was suggested by an AI assistant (Claude) during project planning, based on the Scryfall card format and the structure of the Comprehensive Rules, and then reviewed and normalised. The prompt below reproduces that request so it can be re-run with any LLM, together with 3 sample cards from `data/sample/cards_sample.json` and the excerpt in `data/sample/cr_sample.txt`.

---

You are designing a Neo4j knowledge graph for a RAG system about Magic: The Gathering. The same database also stores text chunks with vector embeddings.

Data:
1. Scryfall card objects (JSON, 3 examples below)
2. Official card rulings (text, linked to cards by oracle_id)
3. The Comprehensive Rules (numbered text, excerpt below)

Users will ask rules questions ("how does trample work with deathtouch?") and deckbuilding questions ("green creatures with mana value 3 or less that have trample").

Suggest:
- Node labels with their key property (unique id) and other properties
- Relationship types with direction, written as (A)-[:TYPE]->(B)
- Which values should be separate nodes and which should stay as properties, and why
- How to connect cards to the rules that define their keywords
- How text chunks with embeddings should attach to the graph

Rules: use singular PascalCase labels and UPPER_SNAKE_CASE relationships. Avoid near-duplicate types. Explain each choice in one sentence.

[paste samples here]

---

## Normalisation decisions

Where the final schema deviates from a naive one-node-per-field design, and why:

- **Supertypes split from card types** (`Supertype`: Legendary, Basic, Snow vs `CardType`: Creature, Instant ...), so "legendary creatures" is a clean filter instead of string matching on the type line.
- **Mana value is a property, not a node.** It is numeric and used in range filters (`<= 3`).
- **Colors are nodes with a fixed code** (W/U/B/R/G) shared by `HAS_COLOR` and `HAS_COLOR_IDENTITY`, seeded once so the import never creates duplicates.
- **One `Rule` node per numbered rule** (702.19). Subrules (702.19a, b ...) stay inside the chunk text, because they are always read together and 4,000+ tiny nodes would add nothing for retrieval.
- **Rulings are one chunk per card**, not one node per ruling. A card has few rulings and they are always read together.
- **Chunks get a second label per kind** (`RuleChunk`, `CardChunk`, `RulingChunk`), so each kind has its own vector index and no post-filtering is needed.
- **Keywords linked to rules by title**, plus a manual mapping for the cases where Scryfall's keyword name and the rule title differ (see `data/README.md`, "Normalisation of keywords").
- **Relationship names follow one pattern:** `HAS_*` for properties-as-nodes, `IS_TYPE` for the card type, `PRINTED_IN`, `LEGAL_IN`, `DEFINED_BY`, `SUBRULE_OF`.
