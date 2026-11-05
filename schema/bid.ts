import { z } from "zod";
import { text, BAD_BODY } from "./common.ts";

/** Skema penawaran sealed-bid: commit & reveal. */

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;

const auctionId = z.coerce
  .number({ error: "ID lelang tidak valid." })
  .int("ID lelang tidak valid.")
  .positive("ID lelang tidak valid.");

export const commitBidSchema = z.object({
  auctionId,
  commitmentHash: text("Commitment hash")
    .trim()
    .toLowerCase()
    .regex(
      SHA256_HEX_PATTERN,
      "Format commitment hash tidak valid. Harus berupa 64-karakter SHA-256 hex string."
    ),
}, BAD_BODY);

export const revealBidSchema = z.object({
  auctionId,
  // Rupiah tidak memiliki pecahan -> bilangan bulat. Ini juga mencegah selisih
  // format angka desimal antara client dan server saat hash dihitung ulang.
  bidAmount: z.coerce
    .number({ error: "Nominal penawaran tidak valid." })
    .int("Nominal penawaran harus berupa bilangan bulat (Rupiah).")
    .positive("Nominal penawaran tidak valid.")
    .max(1e13, "Nominal penawaran melebihi batas yang diizinkan."),
  nonce: text("Secret Nonce")
    .trim()
    .min(1, "Secret Nonce diperlukan untuk membuka penawaran.")
    .max(256, "Secret Nonce terlalu panjang."),
}, BAD_BODY);

export type CommitBidInput = z.infer<typeof commitBidSchema>;
export type RevealBidInput = z.infer<typeof revealBidSchema>;
