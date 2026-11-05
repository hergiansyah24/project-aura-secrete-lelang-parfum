import { NextRequest, NextResponse } from "next/server";
import { createAuctionSchema, fieldErrors, firstErrorMessage } from "@/schema";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await syncAuctionStages();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const stage = (searchParams.get("stage") || "ALL").toUpperCase();
    const sortBy = searchParams.get("sortBy") || "newest";

    const currentUser = await getCurrentUser();

    const validStages = ["COMMIT", "REVEAL", "COMPLETED"];

    if (stage !== "ALL" && !validStages.includes(stage)) {
      return NextResponse.json(
        { error: "Filter tahap lelang tidak valid." },
        { status: 400 }
      );
    }

    const orderBy =
      sortBy === "price_asc"
        ? { startingPrice: "asc" as const }
        : sortBy === "price_desc"
          ? { startingPrice: "desc" as const }
          : sortBy === "ending_soon"
            ? { commitEndTime: "asc" as const }
            : { id: "desc" as const };

    const auctions = await prisma.auction.findMany({
      where: {
        ...(stage !== "ALL"
          ? { currentStage: stage as "COMMIT" | "REVEAL" | "COMPLETED" }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { perfumeHouse: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        winner: {
          select: { username: true },
        },
        _count: {
          select: { bids: true },
        },
        bids: {
          select: {
            status: true,
          },
        },
      },
      orderBy,
    });

    const userBids = currentUser
      ? await prisma.bid.findMany({
          where: { userId: currentUser.id },
          select: {
            auctionId: true,
            commitmentHash: true,
            status: true,
            revealedAmount: true,
          },
        })
      : [];

    const userBidsMap = new Map(
      userBids.map((bid) => [bid.auctionId, bid])
    );

    const enrichedAuctions = auctions.map((auction) => {
      const myBid = userBidsMap.get(auction.id);

      return {
        id: auction.id,
        title: auction.title,
        perfume_house: auction.perfumeHouse,
        bottle_year: auction.bottleYear,
        concentration: auction.concentration,
        volume_ml: auction.volumeMl,
        description: auction.description,
        top_notes: auction.topNotes,
        heart_notes: auction.heartNotes,
        base_notes: auction.baseNotes,
        image_url: auction.imageUrl,
        starting_price: Number(auction.startingPrice),
        current_stage: auction.currentStage,
        commit_end_time: auction.commitEndTime,
        reveal_end_time: auction.revealEndTime,
        winner_id: auction.winnerId,
        winning_bid_amount:
          auction.winningBidAmount !== null
            ? Number(auction.winningBidAmount)
            : null,
        winning_bid_hash: auction.winningBidHash,
        created_at: auction.createdAt,
        winner_username: auction.winner?.username ?? null,
        bidder_count: auction._count.bids,
        revealed_bidder_count: auction.bids.filter(
          (bid) => bid.status === "REVEALED"
        ).length,
        myBid: myBid
          ? {
              hasCommitted: true,
              commitmentHash: myBid.commitmentHash,
              status: myBid.status,
              revealedAmount:
                myBid.revealedAmount !== null
                  ? Number(myBid.revealedAmount)
                  : null,
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

    return NextResponse.json(
      { error: "Failed to fetch auctions." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Memerlukan hak akses Admin." },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Format JSON tidak valid.",
          fieldErrors: { form: "Format JSON tidak valid." },
        },
        { status: 400 }
      );
    }

    const parsed = createAuctionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: firstErrorMessage(parsed.error),
          fieldErrors: fieldErrors(parsed.error),
        },
        { status: 400 }
      );
    }

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
    } = parsed.data;

    const now = Date.now();
    const commitEndTime = new Date(
      now + commitDurationHours * 60 * 60 * 1000
    );
    const revealEndTime = new Date(
      now + (commitDurationHours + revealDurationHours) * 60 * 60 * 1000
    );

    const newAuction = await prisma.auction.create({
      data: {
        title,
        perfumeHouse,
        bottleYear,
        concentration,
        volumeMl,
        description,
        topNotes,
        heartNotes,
        baseNotes,
        imageUrl:
          imageUrl ??
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
        startingPrice: BigInt(startingPrice),
        currentStage: "COMMIT",
        commitEndTime,
        revealEndTime,
      },
    });

    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_CREATE",
      severity: "INFO",
      details: {
        auctionId: newAuction.id,
        title: newAuction.title,
        startingPrice,
        commitEndTime,
        revealEndTime,
      },
    });

    return NextResponse.json({
      success: true,
      auctionId: newAuction.id,
      message: "Lelang parfum langka berhasil ditambahkan.",
    });
  } catch (error) {
    console.error("POST auction error:", error);

    return NextResponse.json(
      { error: "Gagal menambahkan lelang." },
      { status: 500 }
    );
  }
}