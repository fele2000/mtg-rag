// Input: Scryfall /cards/search pages (one item per page, cards in .data[])
// Output: one item per unique card (oracle_id), flattened for the graph import.
const SUPERTYPES = new Set(['Basic', 'Legendary', 'Ongoing', 'Snow', 'World']);
const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper'];

const cards = $input.all().flatMap(i => (Array.isArray(i.json.data) ? i.json.data : []));
const seen = new Set();
const out = [];

for (const c of cards) {
  if (!c.oracle_id || seen.has(c.oracle_id)) continue;
  seen.add(c.oracle_id);

  // Double-faced, split and adventure cards keep their text in card_faces
  const faces = Array.isArray(c.card_faces) && c.card_faces.length ? c.card_faces : [c];

  const supertypes = new Set();
  const types = new Set();
  const subtypes = new Set();
  for (const f of faces) {
    const [left, right = ''] = String(f.type_line ?? c.type_line ?? '').split(' — ');
    for (const w of left.trim().split(/\s+/).filter(Boolean)) (SUPERTYPES.has(w) ? supertypes : types).add(w);
    for (const w of right.trim().split(/\s+/).filter(Boolean)) subtypes.add(w);
  }

  const pt = faces.find(f => f.power != null);
  const colors = c.colors ?? [...new Set(faces.flatMap(f => f.colors ?? []))];

  out.push({
    json: {
      oracle_id: c.oracle_id,
      scryfall_id: c.id,
      name: c.name,
      mana_cost: c.mana_cost ?? faces.map(f => f.mana_cost ?? '').join(' // '),
      mana_value: c.cmc ?? 0,
      type_line: c.type_line ?? faces.map(f => f.type_line).join(' // '),
      oracle_text: faces.map(f => f.oracle_text ?? '').filter(Boolean).join('\n//\n'),
      power: pt?.power ?? null,
      toughness: pt?.toughness ?? null,
      loyalty: faces.find(f => f.loyalty != null)?.loyalty ?? null,
      rarity: c.rarity,
      colors,
      color_identity: c.color_identity ?? [],
      supertypes: [...supertypes],
      types: [...types],
      subtypes: [...subtypes],
      keywords: c.keywords ?? [],
      set_code: c.set,
      set_name: c.set_name,
      legal_formats: FORMATS.filter(f => ['legal', 'restricted'].includes(c.legalities?.[f])),
      scryfall_uri: c.scryfall_uri,
    },
  });
}

if (!out.length) throw new Error('No cards returned from Scryfall - check set_codes in Config');
return out;
