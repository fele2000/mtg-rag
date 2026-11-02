// Wipes all data but keeps constraints and indexes. Run 02_seed.cypher afterwards.
// In Neo4j Browser keep the ":auto" prefix (needed for IN TRANSACTIONS). Remove it in cypher-shell.
:auto MATCH (n) CALL (n) { DETACH DELETE n } IN TRANSACTIONS OF 5000 ROWS;
