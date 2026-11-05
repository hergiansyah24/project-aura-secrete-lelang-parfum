
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("data/sealed_bid.pre-postgres.sqlite", {
  readOnly: true,
});

const checks = [
  ["users", ["username", 100], ["email", 255], ["password_hash", 255], ["role", 20]],
  ["auctions", ["title", 150], ["perfume_house", 100], ["bottle_year", 100], ["concentration", 100], ["top_notes", 300], ["heart_notes", 300], ["base_notes", 300], ["image_url", 500], ["winning_bid_hash", 64]],
  ["bids", ["commitment_hash", 64]],
  ["audit_logs", ["user_email", 255], ["action", 100], ["severity", 20], ["ip_address", 45]],
];

console.log("=== PEMERIKSAAN BATAS PANJANG ===");

for (const [table, ...columns] of checks) {
  for (const [column, limit] of columns) {
    const result = db.prepare(
      `SELECT MAX(LENGTH("${column}")) AS panjang
       FROM "${table}"`
    ).get();

    if (result.panjang !== null && result.panjang > limit) {
      console.log(`MELEBIHI BATAS: ${table}.${column} = ${result.panjang}/${limit}`);
    } else {
      console.log(`AMAN: ${table}.${column} = ${result.panjang ?? 0}/${limit}`);
    }
  }
}

console.log("\n=== PEMERIKSAAN TANGGAL WAJIB ===");

const dateChecks = [
  ["users", "created_at"],
  ["auctions", "commit_end_time"],
  ["auctions", "reveal_end_time"],
  ["auctions", "created_at"],
  ["bids", "committed_at"],
  ["audit_logs", "created_at"],
];

for (const [table, column] of dateChecks) {
  const result = db.prepare(
    `SELECT COUNT(*) AS total
     FROM "${table}"
     WHERE "${column}" IS NULL OR TRIM("${column}") = ''`
  ).get();

  console.log(`${table}.${column}: ${result.total} kosong`);
}

db.close();
console.log("\nPemeriksaan selesai.");
