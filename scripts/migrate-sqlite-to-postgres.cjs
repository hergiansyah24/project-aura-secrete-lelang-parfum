
const { DatabaseSync } = require("node:sqlite");
const { Client } = require("pg");

process.loadEnvFile(".env");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL tidak ditemukan di .env");
}

const TABLES = {
  users: [
    "id",
    "username",
    "email",
    "password_hash",
    "role",
    "full_name_encrypted",
    "phone_encrypted",
    "address_encrypted",
    "is_flagged",
    "flag_reason",
    "created_at",
  ],
  auctions: [
    "id",
    "title",
    "perfume_house",
    "bottle_year",
    "concentration",
    "volume_ml",
    "description",
    "top_notes",
    "heart_notes",
    "base_notes",
    "image_url",
    "starting_price",
    "current_stage",
    "commit_end_time",
    "reveal_end_time",
    "winner_id",
    "winning_bid_amount",
    "winning_bid_hash",
    "created_at",
  ],
  bids: [
    "id",
    "auction_id",
    "user_id",
    "commitment_hash",
    "status",
    "revealed_amount",
    "revealed_nonce",
    "committed_at",
    "revealed_at",
  ],
  audit_logs: [
    "id",
    "user_id",
    "user_email",
    "action",
    "severity",
    "details",
    "ip_address",
    "created_at",
  ],
};

const DATE_COLUMNS = new Set([
  "created_at",
  "commit_end_time",
  "reveal_end_time",
  "committed_at",
  "revealed_at",
]);

const BIGINT_COLUMNS = new Set([
  "starting_price",
  "winning_bid_amount",
  "revealed_amount",
]);

function convertValue(column, value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (column === "is_flagged") {
    return Boolean(value);
  }

  if (DATE_COLUMNS.has(column)) {
    // SQLite CURRENT_TIMESTAMP tidak memiliki zona waktu,
    // sehingga diperlakukan sebagai UTC.
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
      ? value.replace(" ", "T") + "Z"
      : value;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Format tanggal tidak valid: ${value}`);
    }

    return date;
  }

  if (BIGINT_COLUMNS.has(column)) {
    return String(value);
  }

  return value;
}

async function main() {
  const sqlite = new DatabaseSync(
    "data/sealed_bid.pre-postgres.sqlite",
    { readOnly: true }
  );

  const postgres = new Client({
    connectionString: DATABASE_URL,
  });

  let transactionStarted = false;

  try {
    await postgres.connect();

    const dbInfo = await postgres.query(
      "SELECT current_database() AS name"
    );

    if (dbInfo.rows[0].name !== "riggisa_db") {
      throw new Error(
        `Database tujuan salah: ${dbInfo.rows[0].name}`
      );
    }

    console.log("Terhubung ke database riggisa_db.");

    // Pastikan tabel tujuan masih kosong.
    for (const table of Object.keys(TABLES)) {
      const result = await postgres.query(
        `SELECT COUNT(*)::int AS total FROM public."${table}"`
      );

      if (result.rows[0].total !== 0) {
        throw new Error(
          `Tabel ${table} tidak kosong. Migrasi dibatalkan agar data tidak tertimpa.`
        );
      }
    }

    await postgres.query("BEGIN");
    transactionStarted = true;

    console.log("\n=== PROSES MIGRASI ===");

    const expectedCounts = {};

    for (const [table, columns] of Object.entries(TABLES)) {
      const rows = sqlite
        .prepare(`SELECT * FROM "${table}"`)
        .all();

      expectedCounts[table] = rows.length;

      for (const row of rows) {
        const values = columns.map((column) =>
          convertValue(column, row[column])
        );

        const placeholders = values
          .map((_, index) => `$${index + 1}`)
          .join(", ");

        const columnNames = columns
          .map((column) => `"${column}"`)
          .join(", ");

        await postgres.query(
          `INSERT INTO public."${table}" (${columnNames})
           VALUES (${placeholders})`,
          values
        );
      }

      console.log(`${table}: ${rows.length} baris dipindahkan.`);
    }

    console.log("\n=== PENYESUAIAN ID OTOMATIS ===");

    for (const table of Object.keys(TABLES)) {
      await postgres.query(`
        SELECT setval(
          pg_get_serial_sequence('public.${table}', 'id'),
          COALESCE(MAX(id), 1),
          COUNT(*) > 0
        )
        FROM public."${table}"
      `);

      console.log(`${table}: sequence diperbarui.`);
    }

    console.log("\n=== VERIFIKASI JUMLAH DATA ===");

    for (const table of Object.keys(TABLES)) {
      const result = await postgres.query(
        `SELECT COUNT(*)::int AS total FROM public."${table}"`
      );

      const actual = result.rows[0].total;
      const expected = expectedCounts[table];

      console.log(`${table}: ${actual}/${expected}`);

      if (actual !== expected) {
        throw new Error(`Jumlah data ${table} tidak cocok.`);
      }
    }

    await postgres.query("COMMIT");
    transactionStarted = false;

    console.log("\nMIGRASI BERHASIL!");
    console.log("Seluruh data berhasil dipindahkan.");
  } catch (error) {
    if (transactionStarted) {
      await postgres.query("ROLLBACK");
      console.log("\nTransaksi dibatalkan (ROLLBACK).");
    }

    console.error("\nMIGRASI GAGAL:", error.message);
    process.exitCode = 1;
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

main();
