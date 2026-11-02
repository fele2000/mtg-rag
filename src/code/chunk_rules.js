// Splits the Comprehensive Rules TXT into one chunk per numbered rule (e.g. 702.19 incl. 702.19a-e).
// Rules longer than MAX characters are split on line boundaries into #1, #2, ...
const MAX = 3500;

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const raw = String($input.first().json.data ?? '').replace(/^﻿/, '').replace(/\r/g, '');
const lines = raw.split('\n').map(l => l.trim());
const version = (raw.match(/effective as of ([^.\n]+)/i) ?? [])[1]?.trim() ?? 'unknown';

const start = lines.findIndex(l => /^100\.1\. /.test(l));
if (start < 0) throw new Error('Rule 100.1 not found - is cr_url pointing at the Comprehensive Rules TXT?');
let end = lines.findIndex((l, i) => i > start && l === 'Glossary');
if (end < 0) end = lines.length;

// Section titles ("702. Keyword Abilities") from the table of contents and the body
const sections = {};
for (const l of lines.slice(0, end)) {
  const m = l.match(/^(\d{3})\. (.+)$/);
  if (m) sections[m[1]] = m[2];
}

const rules = [];
let cur = null;
for (const l of lines.slice(start, end)) {
  if (!l) continue;
  if (/^\d\. [A-Z]/.test(l) || /^\d{3}\. /.test(l)) { cur = null; continue; } // chapter / section headers
  const m = l.match(/^(\d{3})\.(\d+)\. (.+)$/);
  if (m) {
    cur = { number: `${m[1]}.${m[2]}`, section: m[1], heading: m[3], lines: [l] };
    rules.push(cur);
    continue;
  }
  if (cur) cur.lines.push(l); // subrules like 702.19a and "Example:" lines
}

const out = [];
for (const r of rules) {
  // Keyword rules have a bare title ("Trample"); normal rules are full sentences ending with '.'
  const title = r.heading.endsWith('.') ? null : r.heading;
  const sectionTitle = sections[r.section] ?? null;
  const header = `Comprehensive Rules > ${r.section}. ${sectionTitle ?? ''} > ${r.number}${title ? ' ' + title : ''}`;

  const parts = [];
  let buf = [];
  let len = 0;
  for (const l of r.lines) {
    if (buf.length && len + l.length > MAX) { parts.push(buf); buf = []; len = 0; }
    buf.push(l);
    len += l.length + 1;
  }
  if (buf.length) parts.push(buf);

  parts.forEach((p, idx) => {
    const text = `${header}\n${p.join('\n')}`;
    out.push({
      json: {
        chunk_id: `rule:${r.number}${parts.length > 1 ? '#' + (idx + 1) : ''}`,
        source_type: 'rule',
        parent_id: r.number,
        number: r.number,
        section: r.section,
        section_title: sectionTitle,
        title,
        cr_version: version,
        text,
        hash: fnv1a(text),
        source: `Magic Comprehensive Rules (effective ${version}), rule ${r.number}`,
      },
    });
  });
}

return out;
