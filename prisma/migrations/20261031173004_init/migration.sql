-- CreateEnum
CREATE TYPE "AuctionStage" AS ENUM ('COMMIT', 'REVEAL', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('COMMITTED', 'REVEALED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'bidder',
    "full_name_encrypted" TEXT,
    "phone_encrypted" TEXT,
    "address_encrypted" TEXT,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "perfume_house" VARCHAR(100) NOT NULL,
    "bottle_year" VARCHAR(100) NOT NULL,
    "concentration" VARCHAR(100) NOT NULL,
    "volume_ml" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "top_notes" VARCHAR(300) NOT NULL,
    "heart_notes" VARCHAR(300) NOT NULL,
    "base_notes" VARCHAR(300) NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "starting_price" BIGINT NOT NULL,
    "current_stage" "AuctionStage" NOT NULL DEFAULT 'COMMIT',
    "commit_end_time" TIMESTAMP(3) NOT NULL,
    "reveal_end_time" TIMESTAMP(3) NOT NULL,
    "winner_id" INTEGER,
    "winning_bid_amount" BIGINT,
    "winning_bid_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" SERIAL NOT NULL,
    "auction_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "commitment_hash" VARCHAR(64) NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'COMMITTED',
    "revealed_amount" BIGINT,
    "revealed_nonce" TEXT,
    "committed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revealed_at" TIMESTAMP(3),

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_email" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "details" TEXT NOT NULL,
    "ip_address" VARCHAR(45) DEFAULT '127.0.0.1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "bids_auction_id_idx" ON "bids"("auction_id");

-- CreateIndex
CREATE INDEX "bids_user_id_idx" ON "bids"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bids_auction_id_user_id_key" ON "bids"("auction_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
