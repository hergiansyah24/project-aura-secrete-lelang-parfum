
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("data/sealed_bid.pre-postgres.sqlite", {
  readOnly: true,
});

function show(title, sql) {
  console.log(`\n=== ${title} ===`);
  console.log(db.prepare(sql).all());
}

// Nilai enum yang tersimpan
show(
  "AUCTION STAGE",
  "SELECT DISTINCT current_stage FROM auctions"
);

show(
  "BID STATUS",
  "SELECT DISTINCT status FROM bids"
);

// Nilai boolean
show(
  "IS FLAGGED",
  "SELECT DISTINCT is_flagged FROM users"
);

// Pemeriksaan tanggal
show(
  "FORMAT TANGGAL",
  `SELECT 'users' AS tabel, created_at AS tanggal FROM users
   UNION ALL
   SELECT 'auctions', created_at FROM auctions
   UNION ALL
   SELECT 'bids', committed_at FROM bids
   UNION ALL
   SELECT 'audit_logs', created_at FROM audit_logs
   LIMIT 10`
);

// Pemeriksaan kemungkinan duplikasi
show(
  "DUPLIKASI USERNAME",
  `SELECT username, COUNT(*) AS total
   FROM users GROUP BY username HAVING COUNT(*) > 1`
);

show(
  "DUPLIKASI EMAIL",
  `SELECT email, COUNT(*) AS total
   FROM users GROUP BY email HAVING COUNT(*) > 1`
);

show(
  "DUPLIKASI BID",
  `SELECT auction_id, user_id, COUNT(*) AS total
   FROM bids GROUP BY auction_id, user_id HAVING COUNT(*) > 1`
);

// Pemeriksaan ID terbesar
show(
  "ID TERBESAR",
  `SELECT 'users' AS tabel, MAX(id) AS max_id FROM users
   UNION ALL SELECT 'auctions', MAX(id) FROM auctions
   UNION ALL SELECT 'bids', MAX(id) FROM bids
   UNION ALL SELECT 'audit_logs', MAX(id) FROM audit_logs`
);

db.close();
