// The Neo4j HTTP API returns 200 even when Cypher fails, so fail loudly here.
for (const item of $input.all()) {
  const errors = item.json.errors ?? [];
  if (errors.length) throw new Error('Neo4j error: ' + JSON.stringify(errors));
}
return [{ json: { ok: true, batches: $input.all().length } }];
