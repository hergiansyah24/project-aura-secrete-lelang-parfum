
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("data/sealed_bid.pre-postgres.sqlite", {
  readOnly: true,
});

const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  `)
  .all();

console.log("=== HASIL PEMERIKSAAN DATABASE SQLITE ===");

for (const table of tables) {
  const result = db
    .prepare(`SELECT COUNT(*) AS total FROM "${table.name}"`)
    .get();

  console.log(`${table.name}: ${result.total} baris`);
}

db.close();
