// 32 texts per request instead of one request per chunk.
// n8n's HTTP node fires all items concurrently by default, which floods Ollama
// (requests queue up and Docker's proxy starts refusing connections).
const BATCH = 32;
const chunks = $input.all().map(i => i.json);
const out = [];
for (let i = 0; i < chunks.length; i += BATCH) {
  out.push({ json: { inputs: chunks.slice(i, i + BATCH).map(c => 'search_document: ' + c.text) } });
}
return out;
