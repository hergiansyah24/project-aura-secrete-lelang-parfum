
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("data/sealed_bid.pre-postgres.sqlite", {
  readOnly: true,
});

function show(title, sql) {
  console.log(`\n=== ${title} ===`);
  console.log(db.prepare(sql).all());
}

// 1. Periksa semua tanggal
show(
  "SELURUH DATA TANGGAL",
  `
  SELECT 'users.created_at' AS kolom, created_at AS tanggal FROM users
  UNION ALL
  SELECT 'auctions.created_at', created_at FROM auctions
  UNION ALL
  SELECT 'auctions.commit_end_time', commit_end_time FROM auctions
  UNION ALL
  SELECT 'auctions.reveal_end_time', reveal_end_time FROM auctions
  UNION ALL
  SELECT 'bids.committed_at', committed_at FROM bids
  UNION ALL
  SELECT 'bids.revealed_at', revealed_at FROM bids
  UNION ALL
  SELECT 'audit_logs.created_at', created_at FROM audit_logs
  `
);

// 2. Periksa foreign key
show(
  "FOREIGN KEY YANG BERMASALAH",
  "PRAGMA foreign_key_check"
);

// 3. Periksa kolom wajib yang kosong
show(
  "KOLOM WAJIB YANG KOSONG",
  `
  SELECT 'users.username' AS kolom, COUNT(*) AS total
  FROM users WHERE username IS NULL
  UNION ALL
  SELECT 'users.email', COUNT(*) FROM users WHERE email IS NULL
  UNION ALL
  SELECT 'users.password_hash', COUNT(*) FROM users WHERE password_hash IS NULL
  UNION ALL
  SELECT 'auctions.title', COUNT(*) FROM auctions WHERE title IS NULL
  UNION ALL
  SELECT 'bids.commitment_hash', COUNT(*) FROM bids WHERE commitment_hash IS NULL
  UNION ALL
  SELECT 'audit_logs.action', COUNT(*) FROM audit_logs WHERE action IS NULL
  `
);

// 4. Periksa panjang maksimum teks
show(
  "PANJANG MAKSIMUM DATA TEKS",
  `
  SELECT 'users.username' AS kolom, MAX(LENGTH(username)) AS panjang FROM users
  UNION ALL
  SELECT 'users.email', MAX(LENGTH(email)) FROM users
  UNION ALL
  SELECT 'auctions.title', MAX(LENGTH(title)) FROM auctions
  UNION ALL
  SELECT 'auctions.image_url', MAX(LENGTH(image_url)) FROM auctions
  UNION ALL
  SELECT 'bids.commitment_hash', MAX(LENGTH(commitment_hash)) FROM bids
  UNION ALL
  SELECT 'audit_logs.action', MAX(LENGTH(action)) FROM audit_logs
  `
);

db.close();

console.log("\nPemeriksaan selesai.");
