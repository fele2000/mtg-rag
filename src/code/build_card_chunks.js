// Builds one chunk per card and one chunk per card's rulings.
// Input: responses from Scryfall /cards/{id}/rulings, in the same order as 'Normalize cards'.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const cards = $('Normalize cards').all().map(i => i.json);
const rulings = $input.all().map(i => i.json);
const out = [];

cards.forEach((c, idx) => {
  const stats = c.power != null ? `${c.power}/${c.toughness}` : c.loyalty != null ? `Loyalty ${c.loyalty}` : null;
  const cardText = [
    `${c.name} ${c.mana_cost ?? ''}`.trim(),
    c.type_line,
    c.oracle_text,
    stats,
    `Set: ${c.set_name} (${String(c.set_code).toUpperCase()})`,
  ].filter(Boolean).join('\n');

  out.push({
    json: {
      chunk_id: `card:${c.oracle_id}`,
      source_type: 'card',
      parent_id: c.oracle_id,
      text: cardText,
      hash: fnv1a(cardText),
      source: `Scryfall: ${c.name} (${c.scryfall_uri})`,
    },
  });

  const list = Array.isArray(rulings[idx]?.data) ? rulings[idx].data : [];
  if (list.length) {
    const rulingText = [`Official rulings for ${c.name}:`, ...list.map(r => `- (${r.published_at}) ${r.comment}`)].join('\n');
    out.push({
      json: {
        chunk_id: `rulings:${c.oracle_id}`,
        source_type: 'ruling',
        parent_id: c.oracle_id,
        text: rulingText,
        hash: fnv1a(rulingText),
        source: `Scryfall rulings: ${c.name} (${c.scryfall_uri})`,
      },
    });
  }
});

return out;
