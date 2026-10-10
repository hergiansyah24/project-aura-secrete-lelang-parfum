import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { encryptSensitiveData } from "./crypto";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "sealed_bid.sqlite");
  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode & foreign keys for performance and integrity
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  dbInstance.exec("PRAGMA foreign_keys = ON;");

  initSchema(dbInstance);
  seedInitialData(dbInstance);

  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'bidder',
      full_name_encrypted TEXT,
      phone_encrypted TEXT,
      address_encrypted TEXT,
      is_flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      perfume_house TEXT NOT NULL,
      bottle_year TEXT NOT NULL,
      concentration TEXT NOT NULL,
      volume_ml INTEGER NOT NULL,
      description TEXT NOT NULL,
      top_notes TEXT NOT NULL,
      heart_notes TEXT NOT NULL,
      base_notes TEXT NOT NULL,
      image_url TEXT NOT NULL,
      starting_price INTEGER NOT NULL,
      current_stage TEXT NOT NULL DEFAULT 'COMMIT',
      commit_end_time TEXT NOT NULL,
      reveal_end_time TEXT NOT NULL,
      winner_id INTEGER REFERENCES users(id),
      winning_bid_amount INTEGER,
      winning_bid_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      commitment_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMMITTED',
      revealed_amount INTEGER,
      revealed_nonce TEXT,
      committed_at TEXT DEFAULT (datetime('now')),
      revealed_at TEXT,
      UNIQUE(auction_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      details TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
    CREATE INDEX IF NOT EXISTS idx_bids_user ON bids(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

function seedInitialData(db: DatabaseSync) {
  // Check if users already seeded
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  if (userCount === 0) {
    const adminPass = bcrypt.hashSync("AdminSecret123!", 10);
    const bidderPass = bcrypt.hashSync("BidderSecret123!", 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name_encrypted, phone_encrypted, address_encrypted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin
    insertUser.run(
      "admin",
      "curator@aurasecrete.luxury",
      adminPass,
      "admin",
      encryptSensitiveData("Monsieur Jean-Luc Vaultier"),
      encryptSensitiveData("+62 811 8899 0011"),
      encryptSensitiveData("The Grand Vault Room 88, Menteng Executive, Jakarta Pusat")
    );

    // 2. Demo Bidder: Alexander
    insertUser.run(
      "alexander",
      "alex@perfumecollector.id",
      bidderPass,
      "bidder",
      encryptSensitiveData("Alexander Surya Wardhana"),
      encryptSensitiveData("+62 812 3456 7890"),
      encryptSensitiveData("Jl. Senopati Boulevard No. 19, Kebayoran Baru, Jakarta Selatan")
    );

    // 3. Demo Bidder: Clara
    insertUser.run(
      "clara",
      "clara@nicheparfums.com",
      bidderPass,
      "bidder",
      encryptSensitiveData("Clara Isabella Wijaya"),
      encryptSensitiveData("+62 813 9876 5432"),
      encryptSensitiveData("Apartemen Dharmawangsa Residence Tower A Lt. 22, Jakarta Selatan")
    );
  }

  // Check if auctions already seeded
  const auctionCount = (db.prepare("SELECT COUNT(*) as count FROM auctions").get() as { count: number }).count;
  if (auctionCount === 0) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const insertAuction = db.prepare(`
      INSERT INTO auctions (
        title, perfume_house, bottle_year, concentration, volume_ml,
        description, top_notes, heart_notes, base_notes, image_url,
        starting_price, current_stage, commit_end_time, reveal_end_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Auction 1: Active in COMMIT stage (Open for sealed bids)
    insertAuction.run(
      "Baccarat Les Larmes Sacrées de Thèbes (1998 Flacon)",
      "Baccarat Parfumeur Paris",
      "1998 Limited Edition #14/100",
      "Pure Parfum Extrait",
      30,
      "Salah satu parfum paling langka dan bernilai tinggi di dunia. Dikemas dalam botol piramida kristal Baccarat murni bertatahkan amethyst ungu. Formula aroma dibuat oleh Christine Nagel, menangkap kemegahan ritual kuil Thebes kuno di Mesir.",
      "Frankincense Kuno, Cardamom Liar, Myrtle, Green Fig",
      "Egyptian Jasmine, Geranium, Cananga, Golden Amber",
      "Aged Sandalwood, Rare Myrrh, Egyptian Musk, Benzoin",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
      68000000,
      "COMMIT",
      new Date(now + 2 * oneHour).toISOString(),
      new Date(now + 6 * oneHour).toISOString()
    );

    // Auction 2: Active in COMMIT stage
    insertAuction.run(
      "Clive Christian No. 1 Imperial Majesty (Vintage 2006)",
      "Clive Christian",
      "2006 Original Release Batch",
      "20% Concentrated Parfum Extrait",
      50,
      "Parfum legendaris pemegang Guinness World Record. Dipersembahkan dalam botol kristal polesan tangan dengan leher emas 18 karat bertahtakan berlian putih lima karat. Minyak aromanya membutuhkan waktu ekstraksi lebih dari enam bulan.",
      "Calabrian Bergamot, Sicilian Mandarin, Pink Pepper, Thyme",
      "Lily of the Valley, Heliotrope, Cardamom, Rose de Mai",
      "50-Year Aged Indian Sandalwood, Tahitian Vanilla, Cedarwood, Tonka",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
      95000000,
      "COMMIT",
      new Date(now + 3 * oneHour).toISOString(),
      new Date(now + 8 * oneHour).toISOString()
    );

    // Auction 3: In REVEAL stage (Ready for revealing secret bids!)
    insertAuction.run(
      "Guerlain Djedi (1927 Bouchon Bouché Flacon Antique)",
      "Maison Guerlain Paris",
      "1927 Pre-War Original Antique",
      "Extrait Antique Flacon",
      60,
      "Koleksi museum pribadi Jacques Guerlain dari tahun 1927. Menghormati sang penyihir misterius dalam mitologi Mesir Djedi. Botol kaca Baccarat orisinil masih memiliki segel kawat benang emas pabrikan Paris.",
      "Antique Vetiver, Bergamot, Orris Root, Green Leaves",
      "Cuir Antique (Vintage Leather), Bulgarian Rose, Civet, Animalic Musk",
      "Cistus Labdanum, French Oakmoss, Ambergris, Dark Patchouli",
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
      120000000,
      "REVEAL",
      new Date(now - 30 * 60 * 1000).toISOString(), // commit ended 30 mins ago
      new Date(now + 4 * oneHour).toISOString()
    );

    // Auction 4: COMPLETED with Winner
    const resCompleted = insertAuction.run(
      "Roja Parfums Haute Luxe (Bespoke 24K Gold Leaf Flacon)",
      "Roja Parfums London",
      "2014 Reserve Masterpiece",
      "Parfum Absolu",
      100,
      "Karya agung sang maestro Roja Dove yang mengandung serpihan emas murni 24 karat yang melayang di dalam cairan parfum. Menggunakan bahan-bahan termahal di dunia wewangian termasuk Ambergris laut alami dan Orris Florentine murni.",
      "Bergamot, Sicilian Lemon, Mandarin",
      "Rose de Mai de Grasse, Jasmin de Grasse, Ylang-Ylang",
      "Ginger, Cinnamon, Clove, 24K Ambergris, Benzoin, Oakmoss",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      50000000,
      "COMPLETED",
      new Date(now - 2 * oneDay).toISOString(),
      new Date(now - oneDay).toISOString()
    );

    // Set winner for the completed auction (Auction ID: resCompleted.lastInsertRowid)
    const winnerUserId = 2; // Alexander
    const winningBid = 78500000;
    const winningNonce = "4a9f1165bc938b81d77a06f36402ec94c158bd31ffb91a72983da608c0ef95b7";
    // Formula: SHA256(auctionId + ":" + bidAmount + ":" + nonce)
    const winningHash = crypto.createHash("sha256").update(`${resCompleted.lastInsertRowid}:${winningBid}:${winningNonce}`).digest("hex");

    db.prepare(`
      INSERT INTO bids (auction_id, user_id, commitment_hash, status, revealed_amount, revealed_nonce, committed_at, revealed_at)
      VALUES (?, ?, ?, 'REVEALED', ?, ?, datetime('now', '-2 days'), datetime('now', '-1 days'))
    `).run(resCompleted.lastInsertRowid, winnerUserId, winningHash, winningBid, winningNonce);

    db.prepare(`
      UPDATE auctions SET winner_id = ?, winning_bid_amount = ?, winning_bid_hash = ?
      WHERE id = ?
    `).run(winnerUserId, winningBid, winningHash, resCompleted.lastInsertRowid);
  }
}

