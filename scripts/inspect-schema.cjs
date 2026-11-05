
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("data/sealed_bid.pre-postgres.sqlite", {
  readOnly: true,
});

const tables = ["users", "auctions", "bids", "audit_logs"];

for (const table of tables) {
  console.log(`\n========== ${table.toUpperCase()} ==========`);

  const columns = db
    .prepare(`PRAGMA table_info("${table}")`)
    .all();

  for (const column of columns) {
    console.log(
      `${column.name} | ${column.type} | ${
        column.notnull ? "NOT NULL" : "NULL"
      } | ${column.pk ? "PRIMARY KEY" : ""}`
    );
  }

  const foreignKeys = db
    .prepare(`PRAGMA foreign_key_list("${table}")`)
    .all();

  console.log("Foreign Keys:", foreignKeys);
}

db.close();
