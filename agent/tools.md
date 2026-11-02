# Agent tools

All tools are n8n sub-workflows ("When Executed by Another Workflow" trigger) connected to the agent as workflow tools. Paste the **Description** into each tool's description field. That text is what the model reads when it decides which tool to call.

| Tool | Workflow file | Retrieval type | Index / pattern |
|---|---|---|---|
| search_rules | `workflows/10_tool_search_rules.json` | Vector | `rule_chunk_embedding` + `ruling_chunk_embedding` |
| search_cards | `workflows/11_tool_search_cards.json` | Vector | `card_chunk_embedding` |
| query_cards | `workflows/12_tool_query_cards.json` | Graph | Card filters over Color, CardType, Subtype, Keyword, Set, Format |
| get_card | `workflows/13_tool_get_card.json` | Graph | Card neighbourhood: Keyword -> Rule -> RuleChunk, RulingChunk, Set, Format |
| hybrid_search | `workflows/14_tool_hybrid_search.json` | Vector + graph in one Cypher query | Vector hits on rules/cards, expanded through Keyword and DEFINED_BY |

---

## search_rules
**Description:**
Semantic search in the official Magic Comprehensive Rules and in official card rulings. Use it for any question about how rules, keywords, game steps or card interactions work. Input `query`: the rules question in English, phrased as a full sentence (e.g. "how is combat damage assigned when a creature with trample is blocked"). Input `k`: number of results, default 5. Returns text chunks with rule number, similarity score and source. Cite the rule numbers in your answer.

**Inputs:** `query` (string, required), `k` (number, optional, 1-15)
**Returns:** `[{kind: "rule"|"ruling", text, score, source}]`

## search_cards
**Description:**
Semantic search over card text. Use it when the user describes what a card should DO or feel like rather than exact attributes, e.g. "creatures that make mana", "cards similar to Llanowar Elves", "removal for flying creatures". Input `query`: a description in English. Input `k`: number of results, default 5. Returns card names, full card text, similarity score and Scryfall link. Do not use it to count cards.

**Inputs:** `query` (string, required), `k` (number, optional)
**Returns:** `[{name, text, score, source}]`

## query_cards
**Description:**
Exact search in the card graph by attributes. Use it for lists and counts with concrete filters. All inputs are optional strings; leave unused ones empty. `colors`: letters from WUBRG, e.g. "G" or "UR" (card must have all of them). `exact_colors`: "true" to exclude other colors. `type`: Creature, Instant, Sorcery, Enchantment, Artifact, Land, Planeswalker. `subtype`: e.g. Elf, Dragon, Aura. `keyword`: e.g. Flying, Trample, Ward. `min_mana_value` / `max_mana_value`: numbers. `rarity`: common, uncommon, rare, mythic. `set`: set code, e.g. fdn. `format`: standard, pioneer, modern, legacy, vintage, commander, pauper. `text_contains`: words that must appear in the rules text. `limit`: max cards returned (default 15). Returns `total_matches` (use this for counting) and a list of cards with Scryfall links.

**Inputs:** colors, exact_colors, type, subtype, keyword, min_mana_value, max_mana_value, rarity, set, format, text_contains, limit (all strings)
**Returns:** `{total_matches, cards: [{name, mana_cost, type_line, oracle_text, power, toughness, rarity, source}]}`

## get_card
**Description:**
Looks up one card by name and returns everything the graph knows about it: card text, mana value, keywords together with the Comprehensive Rule that defines each keyword, official rulings, sets and legal formats. Use it whenever the user names a specific card. Input `name`: the card name (partial names work, exact names are preferred).

**Inputs:** `name` (string, required)
**Returns:** `{name, mana_cost, mana_value, type_line, oracle_text, power, toughness, keywords: [{keyword, rule, rule_text}], rulings, sets, legal_in, source}`

## hybrid_search
**Description:**
Combined search: finds the most relevant rules and cards by meaning, then follows the graph to connect them. Rule hits come back with the cards in the database that have that keyword; card hits come back with their keywords and the rule numbers defining them. Use it for questions that mix a mechanic and cards, e.g. "what does ward do and which cards have it". Input `query`: question in English. Input `k`: results per side, default 5.

**Inputs:** `query` (string, required), `k` (number, optional)
**Returns:** `[{kind: "rule"|"card", name, text, score, related, source}]`
