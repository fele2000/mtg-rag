UNWIND $rows AS row
MERGE (ch:Chunk {id: row.chunk_id})
SET ch:__LABEL__, ch.text = row.text, ch.source = row.source,
    ch.source_type = row.source_type, ch.hash = row.hash, ch.embedding = row.embedding
WITH ch, row
__LINK__
