// Run once in Neo4j Browser (enable multi-statement queries) before the first ingestion.
// Embedding model: nomic-embed-text via Ollama -> 768 dimensions.
// If you switch model (e.g. mxbai-embed-large = 1024), change the dimensions below and re-embed.

// ---------- Constraints (also create the backing indexes) ----------
CREATE CONSTRAINT card_oracle_id IF NOT EXISTS FOR (n:Card)      REQUIRE n.oracle_id IS UNIQUE;
CREATE CONSTRAINT set_code       IF NOT EXISTS FOR (n:Set)       REQUIRE n.code IS UNIQUE;
CREATE CONSTRAINT color_code     IF NOT EXISTS FOR (n:Color)     REQUIRE n.code IS UNIQUE;
CREATE CONSTRAINT cardtype_name  IF NOT EXISTS FOR (n:CardType)  REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT supertype_name IF NOT EXISTS FOR (n:Supertype) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT subtype_name   IF NOT EXISTS FOR (n:Subtype)   REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT keyword_name   IF NOT EXISTS FOR (n:Keyword)   REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT format_name    IF NOT EXISTS FOR (n:Format)    REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT rule_number    IF NOT EXISTS FOR (n:Rule)      REQUIRE n.number IS UNIQUE;
CREATE CONSTRAINT chunk_id       IF NOT EXISTS FOR (n:Chunk)     REQUIRE n.id IS UNIQUE;

// ---------- Vector indexes (one per chunk kind, so no post-filtering is needed) ----------
CREATE VECTOR INDEX rule_chunk_embedding IF NOT EXISTS
FOR (n:RuleChunk) ON n.embedding
OPTIONS { indexConfig: { `vector.dimensions`: 768, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX card_chunk_embedding IF NOT EXISTS
FOR (n:CardChunk) ON n.embedding
OPTIONS { indexConfig: { `vector.dimensions`: 768, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX ruling_chunk_embedding IF NOT EXISTS
FOR (n:RulingChunk) ON n.embedding
OPTIONS { indexConfig: { `vector.dimensions`: 768, `vector.similarity_function`: 'cosine' } };
