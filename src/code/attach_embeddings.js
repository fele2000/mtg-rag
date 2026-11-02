// Each Ollama response holds up to 32 embeddings; flatten them back onto the chunks in order.
const chunks = $('Filter changed chunks').all().map(i => i.json);
const embeddings = $input.all().flatMap(i => i.json.embeddings ?? []);
if (embeddings.length !== chunks.length) {
  throw new Error(`Got ${embeddings.length} embeddings for ${chunks.length} chunks`);
}
return chunks.map((c, idx) => ({ json: { ...c, embedding: embeddings[idx] } }));
