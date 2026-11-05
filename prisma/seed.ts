import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("SeedOnly-Password-123!", 10);

  // Membuat atau menggunakan kembali user contoh.
  const user = await prisma.user.upsert({
    where: { username: "seed_bidder" },
    update: {},
    create: {
      username: "seed_bidder",
      email: "seed_bidder@example.test",
      passwordHash,
      role: "bidder",
    },
  });

  // Mencari Auction contoh agar tidak membuat duplikat.
  let auction = await prisma.auction.findFirst({
    where: {
      title: "Seed Auction - Example Perfume",
      perfumeHouse: "Seed House",
    },
  });

  if (!auction) {
    auction = await prisma.auction.create({
      data: {
        title: "Seed Auction - Example Perfume",
        perfumeHouse: "Seed House",
        bottleYear: "2024",
        concentration: "Eau de Parfum",
        volumeMl: 50,
        description: "Data contoh untuk pengujian relasi dan CRUD.",
        topNotes: "Citrus",
        heartNotes: "Rose",
        baseNotes: "Musk",
        imageUrl: "",
        startingPrice: 100000,
        currentStage: "COMMIT",
        commitEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revealEndTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
  }

  // Membuat atau menggunakan kembali Bid berdasarkan unique relation.
  const bid = await prisma.bid.upsert({
    where: {
      auctionId_userId: {
        auctionId: auction.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      auctionId: auction.id,
      userId: user.id,
      commitmentHash: "a".repeat(64),
      status: "COMMITTED",
    },
  });

  console.log("Seed berhasil dijalankan!");
  console.log({
    userId: user.id,
    auctionId: auction.id,
    bidId: bid.id,
  });
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
