
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

after(async () => {
  await prisma.$disconnect();
});

function uniqueSuffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

async function createAuction() {
  const suffix = uniqueSuffix();

  return prisma.auction.create({
    data: {
      title: `Test Auction ${suffix}`,
      perfumeHouse: `Test House ${suffix}`,
      bottleYear: "2024",
      concentration: "Eau de Parfum",
      volumeMl: 100,
      description: "Data pengujian otomatis.",
      topNotes: "Bergamot",
      heartNotes: "Rose",
      baseNotes: "Musk",
      imageUrl: "https://example.test/perfume.jpg",
      startingPrice: 100000n,
      commitEndTime: new Date(Date.now() + 86400000),
      revealEndTime: new Date(Date.now() + 172800000),
    },
  });
}

async function createUser() {
  const suffix = uniqueSuffix();

  return prisma.user.create({
    data: {
      username: `test_${suffix}`,
      email: `test_${suffix}@example.test`,
      passwordHash: "test-password-hash",
      role: "bidder",
    },
  });
}

async function createBidFixture() {
  const user = await createUser();
  const auction = await createAuction();

  const bid = await prisma.bid.create({
    data: {
      auctionId: auction.id,
      userId: user.id,
      commitmentHash: "a".repeat(64),
      status: "COMMITTED",
    },
  });

  return { user, auction, bid };
}

async function cleanupAuction(id: number) {
  await prisma.auction.deleteMany({
    where: { id },
  });
}

async function cleanupBidFixture(
  auctionId: number,
  userId: number,
) {
  await prisma.auction.deleteMany({
    where: { id: auctionId },
  });

  await prisma.user.deleteMany({
    where: { id: userId },
  });
}

// ==========================================
// 1–4. AUCTION CRUD
// ==========================================

test("1. Auction: Create data lelang", async () => {
  const auction = await createAuction();

  try {
    assert.ok(auction.id > 0);
    assert.equal(auction.startingPrice, 100000n);
  } finally {
    await cleanupAuction(auction.id);
  }
});

test("2. Auction: Read data lelang", async () => {
  const created = await createAuction();

  try {
    const found = await prisma.auction.findUnique({
      where: { id: created.id },
    });

    assert.ok(found);
    assert.equal(found.id, created.id);
    assert.equal(found.title, created.title);
  } finally {
    await cleanupAuction(created.id);
  }
});

test("3. Auction: Update data lelang", async () => {
  const created = await createAuction();

  try {
    const updated = await prisma.auction.update({
      where: { id: created.id },
      data: { title: "Test Auction Updated" },
    });

    assert.equal(updated.title, "Test Auction Updated");
  } finally {
    await cleanupAuction(created.id);
  }
});

test("4. Auction: Delete data lelang", async () => {
  const created = await createAuction();

  await prisma.auction.delete({
    where: { id: created.id },
  });

  const found = await prisma.auction.findUnique({
    where: { id: created.id },
  });

  assert.equal(found, null);
});

// ==========================================
// 5–8. BID CRUD
// ==========================================

test("5. Bid: Create data penawaran", async () => {
  const fixture = await createBidFixture();

  try {
    assert.ok(fixture.bid.id > 0);
    assert.equal(fixture.bid.status, "COMMITTED");
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});

test("6. Bid: Read data penawaran", async () => {
  const fixture = await createBidFixture();

  try {
    const found = await prisma.bid.findUnique({
      where: { id: fixture.bid.id },
    });

    assert.ok(found);
    assert.equal(found.id, fixture.bid.id);
    assert.equal(found.auctionId, fixture.auction.id);
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});

test("7. Bid: Update data penawaran", async () => {
  const fixture = await createBidFixture();

  try {
    const updated = await prisma.bid.update({
      where: { id: fixture.bid.id },
      data: {
        status: "REVEALED",
        revealedAmount: 150000n,
        revealedNonce: "nonce-test",
        revealedAt: new Date(),
      },
    });

    assert.equal(updated.status, "REVEALED");
    assert.equal(updated.revealedAmount, 150000n);
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});

test("8. Bid: Delete data penawaran", async () => {
  const fixture = await createBidFixture();

  try {
    await prisma.bid.delete({
      where: { id: fixture.bid.id },
    });

    const found = await prisma.bid.findUnique({
      where: { id: fixture.bid.id },
    });

    assert.equal(found, null);
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});

// ==========================================
// 9–10. PENGUJIAN RELASI
// ==========================================

test("9. Relasi: Bid terhubung dengan Auction dan User", async () => {
  const fixture = await createBidFixture();

  try {
    const found = await prisma.bid.findUnique({
      where: { id: fixture.bid.id },
      include: {
        auction: true,
        user: true,
      },
    });

    assert.ok(found);
    assert.equal(found.auction.id, fixture.auction.id);
    assert.equal(found.user.id, fixture.user.id);
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});

test("10. Relasi: Kombinasi Auction dan User tidak boleh duplikat", async () => {
  const fixture = await createBidFixture();

  try {
    await assert.rejects(
      prisma.bid.create({
        data: {
          auctionId: fixture.auction.id,
          userId: fixture.user.id,
          commitmentHash: "b".repeat(64),
        },
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "P2002",
    );
  } finally {
    await cleanupBidFixture(
      fixture.auction.id,
      fixture.user.id,
    );
  }
});
