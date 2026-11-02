// Links Keyword nodes (from Scryfall) to the Comprehensive Rule that defines them (701.x / 702.x).
for (const item of $input.all()) {
  if (item.json.errors?.length) throw new Error('Neo4j error: ' + JSON.stringify(item.json.errors));
}
return [{ json: { statements: [{ statement: __CYPHER_link_keywords__, parameters: {} }] } }];
