import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    syncAuctionStages();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const stage = (searchParams.get("stage") || "ALL").toUpperCase();
    const sortBy = searchParams.get("sortBy") || "newest";

    const currentUser = await getCurrentUser();
    const db = getDb();

    let query = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bidder_count,
        (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id AND b.status = 'REVEALED') as revealed_bidder_count,
        u.username as winner_username
      FROM auctions a
      LEFT JOIN users u ON a.winner_id = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (stage && stage !== "ALL") {
      query += " AND a.current_stage = ?";
      params.push(stage);
    }

    if (search) {
      query += " AND (a.title LIKE ? OR a.perfume_house LIKE ? OR a.description LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    if (sortBy === "price_asc") {
      query += " ORDER BY a.starting_price ASC";
    } else if (sortBy === "price_desc") {
      query += " ORDER BY a.starting_price DESC";
    } else if (sortBy === "ending_soon") {
      query += " ORDER BY a.commit_end_time ASC";
    } else {
      query += " ORDER BY a.id DESC";
    }

    const auctions = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

    // If user is logged in, fetch their personal bids for these auctions
    let userBidsMap = new Map<number, { commitment_hash: string; status: string; revealed_amount: number | null }>();
    if (currentUser) {
      const myBids = db
        .prepare(`SELECT auction_id, commitment_hash, status, revealed_amount FROM bids WHERE user_id = ?`)
        .all(currentUser.id) as Array<{
          auction_id: number;
          commitment_hash: string;
          status: string;
          revealed_amount: number | null;
        }>;

      for (const b of myBids) {
        userBidsMap.set(b.auction_id, b);
      }
    }

    const enrichedAuctions = auctions.map((auc) => {
      const myBid = userBidsMap.get(auc.id as number);
      return {
        ...auc,
        myBid: myBid
          ? {
              hasCommitted: true,
              commitmentHash: myBid.commitment_hash,
              status: myBid.status,
              revealedAmount: myBid.revealed_amount,
            }
          : {
              hasCommitted: false,
              commitmentHash: null,
              status: null,
              revealedAmount: null,
            },
      };
    });

    return NextResponse.json({ auctions: enrichedAuctions });
  } catch (error) {
    console.error("GET auctions error:", error);
    return NextResponse.json({ error: "Failed to fetch auctions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak. Memerlukan hak akses Admin." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      perfumeHouse,
      bottleYear,
      concentration,
      volumeMl,
      description,
      topNotes,
      heartNotes,
      baseNotes,
      imageUrl,
      startingPrice,
      commitDurationHours,
      revealDurationHours,
    } = body;

    if (!title || !perfumeHouse || !startingPrice) {
      return NextResponse.json({ error: "Judul, rumah parfum, dan starting price wajib diisi." }, { status: 400 });
    }

    const now = Date.now();
    const commitMs = (Number(commitDurationHours) || 2) * 60 * 60 * 1000;
    const revealMs = (Number(revealDurationHours) || 2) * 60 * 60 * 1000;

    const commitEndTime = new Date(now + commitMs).toISOString();
    const revealEndTime = new Date(now + commitMs + revealMs).toISOString();

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO auctions (
        title, perfume_house, bottle_year, concentration, volume_ml,
        description, top_notes, heart_notes, base_notes, image_url,
        starting_price, current_stage, commit_end_time, reveal_end_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMMIT', ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      perfumeHouse.trim(),
      (bottleYear || "Limited Edition").trim(),
      (concentration || "Extrait de Parfum").trim(),
      Number(volumeMl) || 50,
      description.trim(),
      (topNotes || "Bergamot, Citrus").trim(),
      (heartNotes || "Floral, Jasmin").trim(),
      (baseNotes || "Sandalwood, Amber").trim(),
      imageUrl?.trim() || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
      Number(startingPrice),
      commitEndTime,
      revealEndTime
    );

    const newAuctionId = Number(result.lastInsertRowid);

    recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_CREATE",
      severity: "INFO",
      details: {
        auctionId: newAuctionId,
        title,
        startingPrice,
        commitEndTime,
        revealEndTime,
      },
    });

    return NextResponse.json({
      success: true,
      auctionId: newAuctionId,
      message: "Lelang parfum langka berhasil ditambahkan.",
    });
  } catch (error) {
    console.error("POST auction error:", error);
    return NextResponse.json({ error: "Gagal menambahkan lelang." }, { status: 500 });
  }
}

