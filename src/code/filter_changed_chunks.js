// Keep only new chunks or chunks whose text changed. Unchanged chunks are not re-embedded.
const res = $input.first().json;
if (res.errors?.length) throw new Error('Neo4j error: ' + JSON.stringify(res.errors));
const existing = new Map((res.results?.[0]?.data ?? []).map(d => [d.row[0], d.row[1]]));

const chunks = $(__CHUNK_SOURCE_NODE__).all().map(i => i.json);
const changed = chunks.filter(c => existing.get(c.chunk_id) !== c.hash);
const skipped = chunks.length - changed.length;
console.log(`Chunks: ${chunks.length}, unchanged (skipped): ${skipped}, to embed: ${changed.length}`);
return changed.map(c => ({ json: c }));
