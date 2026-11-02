// Config: edit these values once. Every other node reads them via $('Config').first().json
// If n8n runs in Docker and Neo4j/Ollama run on the host, use host.docker.internal.
// If n8n runs directly on Windows (npm / desktop), use localhost.
return [{
  json: {
    neo4j_url: 'http://host.docker.internal:7474',
    neo4j_db: 'neo4j',
    ollama_url: 'http://host.docker.internal:11434',
    embed_model: 'nomic-embed-text',
    // Scryfall set code(s) to ingest. One set is ~250-300 cards. Space separated for several: 'fdn dsk'
    set_codes: 'fdn',
    // Paste the current TXT link from https://magic.wizards.com/en/rules
    cr_url: 'PASTE_COMPREHENSIVE_RULES_TXT_URL_HERE',
  },
}];
