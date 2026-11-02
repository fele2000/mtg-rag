"""Builds importable n8n workflow JSON files from src/code/*.js and src/cypher/*.cypher.

Usage: python src/build_workflows.py   (writes to workflows/)
Edit the .js / .cypher files, not the generated JSON.
"""
import json
import re
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CODE = ROOT / "src" / "code"
CYPHER = ROOT / "src" / "cypher"
OUT = ROOT / "workflows"


def cypher(name: str) -> str:
    return (CYPHER / f"{name}.cypher").read_text().strip()


def js(name: str, **extra) -> str:
    src = (CODE / f"{name}.js").read_text()
    src = re.sub(r"__CYPHER_(\w+)__", lambda m: json.dumps(cypher(m.group(1))), src)
    for key, val in extra.items():
        src = src.replace(f"__{key}__", val)
    assert "__CYPHER_" not in src, name
    return src


CFG = "$('Config').first().json"
NEO4J_URL = f"={{{{ {CFG}.neo4j_url }}}}/db/{{{{ {CFG}.neo4j_db }}}}/tx/commit"


# ---------- node factories ----------
def manual():
    return {"type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "parameters": {}}


def code(src: str, notes: str = ""):
    node = {"type": "n8n-nodes-base.code", "typeVersion": 2, "parameters": {"jsCode": src}}
    if notes:
        node["notes"] = notes
        node["notesInFlow"] = True
    return node


def neo4j(notes: str = ""):
    node = {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "parameters": {
            "method": "POST",
            "url": NEO4J_URL,
            "authentication": "genericCredentialType",
            "genericAuthType": "httpBasicAuth",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify($json) }}",
            "options": {},
        },
    }
    if notes:
        node["notes"] = notes
        node["notesInFlow"] = True
    return node


def ollama_embed(prefix: str, text_expr: str):
    return {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "parameters": {
            "method": "POST",
            "url": f"={{{{ {CFG}.ollama_url }}}}/api/embed",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": f"={{{{ JSON.stringify({{ model: {CFG}.embed_model, input: '{prefix}' + {text_expr} }}) }}}}",
            "options": {},
        },
        "notes": f"nomic-embed-text expects the '{prefix}' prefix",
        "notesInFlow": True,
    }


def ollama_embed_batch():
    return {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "retryOnFail": True,
        "maxTries": 3,
        "waitBetweenTries": 3000,
        "parameters": {
            "method": "POST",
            "url": f"={{{{ {CFG}.ollama_url }}}}/api/embed",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": f"={{{{ JSON.stringify({{ model: {CFG}.embed_model, input: $json.inputs }}) }}}}",
            "options": {"batching": {"batch": {"batchSize": 1, "batchInterval": 0}}},
        },
        "notes": "One request at a time",
        "notesInFlow": True,
    }


SCRYFALL_HEADERS = {
    "parameters": [
        {"name": "User-Agent", "value": "KEA-MTG-RAG/1.0 (school project)"},
        {"name": "Accept", "value": "application/json"},
    ]
}


def scryfall_search():
    q = f"'(' + {CFG}.set_codes.trim().split(/\\s+/).map(s => 'set:' + s).join(' or ') + ')'"
    return {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "parameters": {
            "url": f"={{{{ 'https://api.scryfall.com/cards/search?unique=cards&q=' + encodeURIComponent({q}) }}}}",
            "sendHeaders": True,
            "headerParameters": SCRYFALL_HEADERS,
            "options": {
                "pagination": {
                    "pagination": {
                        "paginationMode": "responseContainsNextURL",
                        "nextURL": "={{ $response.body.next_page }}",
                        "paginationCompleteWhen": "other",
                        "completeExpression": "={{ !$response.body.has_more }}",
                        "requestInterval": 150,
                    }
                }
            },
        },
        "notes": "Paginated, 175 cards per page",
        "notesInFlow": True,
    }


def scryfall_rulings():
    return {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "retryOnFail": True,
        "maxTries": 3,
        "waitBetweenTries": 2000,
        "parameters": {
            "url": "=https://api.scryfall.com/cards/{{ $json.scryfall_id }}/rulings",
            "sendHeaders": True,
            "headerParameters": SCRYFALL_HEADERS,
            "options": {"batching": {"batch": {"batchSize": 1, "batchInterval": 120}}},
        },
        "notes": "1 request per card, 120 ms apart (Scryfall rate limit)",
        "notesInFlow": True,
    }


def download_cr():
    return {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "parameters": {
            "url": f"={{{{ {CFG}.cr_url }}}}",
            "options": {"response": {"response": {"responseFormat": "text", "outputPropertyName": "data"}}},
        },
    }


def exec_trigger(inputs):
    return {
        "type": "n8n-nodes-base.executeWorkflowTrigger",
        "typeVersion": 1.1,
        "parameters": {"inputSource": "workflowInputs", "workflowInputs": {"values": inputs}},
    }


# ---------- workflow assembly ----------
def chain(name: str, steps: list[tuple[str, dict]]):
    nodes, connections = [], {}
    for i, (node_name, node) in enumerate(steps):
        nodes.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{name}/{node_name}")),
            "name": node_name,
            "position": [i * 240, 0 if i % 2 == 0 else 120],
            **node,
        })
        if i + 1 < len(steps):
            connections[node_name] = {"main": [[{"node": steps[i + 1][0], "type": "main", "index": 0}]]}
    return {"name": name, "nodes": nodes, "connections": connections, "settings": {"executionOrder": "v1"}, "pinData": {}}


def embed_and_store(chunk_source_node: str):
    return [
        ("Build hash query", code(js("build_hash_query"))),
        ("Neo4j: existing hashes", neo4j("Duplicate check")),
        ("Filter changed chunks", code(js("filter_changed_chunks", CHUNK_SOURCE_NODE=json.dumps(chunk_source_node)),
                                       "Skips chunks whose hash is unchanged")),
        ("Batch for embedding", code(js("batch_for_embedding"), "32 texts per request")),
        ("Ollama: embed", ollama_embed_batch()),
        ("Attach embeddings", code(js("attach_embeddings"))),
        ("Build chunk batches", code(js("build_chunk_batches"))),
        ("Neo4j: upsert chunks", neo4j("Chunk + vector")),
        ("Build keyword links", code(js("build_link_keywords"))),
        ("Neo4j: link keywords", neo4j("Keyword -[:DEFINED_BY]-> Rule")),
        ("Check result", code(js("check_neo4j"))),
    ]


def ingest_rules():
    return chain("MTG RAG 01 - Ingest Comprehensive Rules", [
        ("Manual trigger", manual()),
        ("Config", code(js("config"))),
        ("Download Comprehensive Rules", download_cr()),
        ("Chunk rules", code(js("chunk_rules"), "1 chunk per numbered rule")),
        ("Build rule node batches", code(js("build_rule_graph_batches"))),
        ("Neo4j: upsert rules", neo4j("Rule graph")),
        ("Check rules import", code(js("check_neo4j"))),
        ("Back to rule chunks", code(js("back_to_rule_chunks"))),
        *embed_and_store("Back to rule chunks"),
    ])


def ingest_cards():
    return chain("MTG RAG 02 - Ingest cards and rulings (Scryfall)", [
        ("Manual trigger", manual()),
        ("Config", code(js("config"))),
        ("Scryfall: search cards", scryfall_search()),
        ("Normalize cards", code(js("normalize_cards"))),
        ("Build card graph batches", code(js("build_card_graph_batches"))),
        ("Neo4j: upsert cards", neo4j("Card graph")),
        ("Check cards import", code(js("check_neo4j"))),
        ("Back to cards", code(js("back_to_cards"))),
        ("Scryfall: rulings", scryfall_rulings()),
        ("Build card chunks", code(js("build_card_chunks"), "card + rulings chunks")),
        *embed_and_store("Build card chunks"),
    ])


FORMAT_RESULT = """// Turns the Neo4j HTTP response into plain objects for the agent.
const res = $input.first().json;
if (res.errors?.length) throw new Error('Neo4j error: ' + JSON.stringify(res.errors));
const r = res.results[0];
let rows = r.data.map(d => Object.fromEntries(r.columns.map((c, i) => [c, d.row[i]])));
if (rows.length && 'score' in rows[0]) rows.sort((a, b) => b.score - a.score);
return [{ json: { count: rows.length, results: rows } }];
"""


def tool_build(cypher_name: str, params_js: str) -> str:
    return (
        "const input = $('Start').first().json;\n"
        f"{params_js}\n"
        f"const statement = {json.dumps(cypher(cypher_name))};\n"
        "return [{ json: { statements: [{ statement, parameters: params }] } }];\n"
    )


K_PARAMS = (
    "const k = Math.min(Math.max(parseInt(input.k) || 5, 1), 15);\n"
    "const params = { k, embedding: $input.first().json.embeddings[0] };"
)

NULLABLE = "const s = v => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());\n"
QUERY_PARAMS = NULLABLE + """const n = v => (s(v) === null || isNaN(Number(v)) ? null : Number(v));
const params = {
  type: s(input.type), subtype: s(input.subtype), keyword: s(input.keyword),
  min_mv: n(input.min_mana_value), max_mv: n(input.max_mana_value),
  colors: (s(input.colors) ?? '').toUpperCase().replace(/[^WUBRG]/g, '').split('').filter(Boolean),
  exact_colors: String(input.exact_colors).toLowerCase() === 'true',
  rarity: s(input.rarity), set: s(input.set), format: s(input.format), text: s(input.text_contains),
  limit: Math.min(Math.max(parseInt(input.limit) || 15, 1), 40),
};"""


def vector_tool(name: str, cypher_name: str):
    return chain(name, [
        ("Start", exec_trigger([{"name": "query", "type": "string"}, {"name": "k", "type": "number"}])),
        ("Config", code(js("config"))),
        ("Ollama: embed query", ollama_embed("search_query: ", "$('Start').first().json.query")),
        ("Build query", code(tool_build(cypher_name, K_PARAMS))),
        ("Neo4j: query", neo4j()),
        ("Format result", code(FORMAT_RESULT)),
    ])


def graph_tool(name: str, cypher_name: str, inputs, params_js: str):
    return chain(name, [
        ("Start", exec_trigger(inputs)),
        ("Config", code(js("config"))),
        ("Build query", code(tool_build(cypher_name, params_js))),
        ("Neo4j: query", neo4j()),
        ("Format result", code(FORMAT_RESULT)),
    ])


def main():
    OUT.mkdir(exist_ok=True)
    workflows = {
        "01_ingest_rules.json": ingest_rules(),
        "02_ingest_cards.json": ingest_cards(),
        "10_tool_search_rules.json": vector_tool("MTG RAG tool - search_rules (vector)", "tool_search_rules"),
        "11_tool_search_cards.json": vector_tool("MTG RAG tool - search_cards (vector)", "tool_search_cards"),
        "12_tool_query_cards.json": graph_tool(
            "MTG RAG tool - query_cards (graph)", "tool_query_cards",
            [{"name": n, "type": "string"} for n in
             ["colors", "exact_colors", "type", "subtype", "keyword", "min_mana_value", "max_mana_value",
              "rarity", "set", "format", "text_contains", "limit"]],
            QUERY_PARAMS),
        "13_tool_get_card.json": graph_tool(
            "MTG RAG tool - get_card (graph)", "tool_get_card",
            [{"name": "name", "type": "string"}],
            NULLABLE + "if (!s(input.name)) throw new Error('name is required');\nconst params = { name: s(input.name) };"),
        "14_tool_hybrid_search.json": vector_tool("MTG RAG tool - hybrid_search (vector + graph)", "tool_hybrid_search"),
    }
    for fname, wf in workflows.items():
        (OUT / fname).write_text(json.dumps(wf, indent=2, ensure_ascii=False))
        print(f"wrote workflows/{fname} ({len(wf['nodes'])} nodes)")


if __name__ == "__main__":
    main()
