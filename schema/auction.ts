import { z } from "zod";
import { text, optionalText, emptyToUndefined, BAD_BODY } from "./common.ts";

/** Skema pembuatan lelang (khusus admin). */

/** Gambar produk: path lokal ("/products/a.png") atau URL http(s) yang valid. */
function isSafeImageReference(value: string): boolean {
  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("\\") && !value.includes("..");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const durationHours = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} harus berupa angka.` })
      .positive(`${label} harus lebih dari 0 jam.`)
      .max(720, `${label} maksimal 720 jam (30 hari).`)
      .default(2)
  );

export const createAuctionSchema = z.object({
  title: text("Judul")
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),

  perfumeHouse: text("Rumah parfum")
    .trim()
    .min(2, "Rumah parfum minimal 2 karakter.")
    .max(100, "Rumah parfum maksimal 100 karakter."),

  bottleYear: optionalText("Tahun botol", 100, "Limited Edition"),
  concentration: optionalText("Konsentrasi", 100, "Extrait de Parfum"),

  volumeMl: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Volume harus berupa angka." })
      .int("Volume harus berupa bilangan bulat (ml).")
      .min(1, "Volume minimal 1 ml.")
      .max(1000, "Volume maksimal 1000 ml.")
      .default(50)
  ),

  description: text("Deskripsi")
    .trim()
    .min(10, "Deskripsi minimal 10 karakter.")
    .max(2000, "Deskripsi maksimal 2000 karakter."),

  topNotes: optionalText("Top notes", 300, "Bergamot, Citrus"),
  heartNotes: optionalText("Heart notes", 300, "Floral, Jasmin"),
  baseNotes: optionalText("Base notes", 300, "Sandalwood, Amber"),

  // undefined -> route memakai gambar bawaan.
  imageUrl: z
    .string({ error: "Gambar harus berupa teks." })
    .trim()
    .max(500, "Alamat gambar maksimal 500 karakter.")
    .nullish()
    .transform((value) => value || undefined)
    .refine(
      (value) => value === undefined || isSafeImageReference(value),
      "Gambar harus berupa path lokal (contoh: /products/nama.png) atau URL http/https yang valid."
    ),

  startingPrice: z.coerce
    .number({ error: "Starting price harus berupa angka." })
    .int("Starting price harus berupa bilangan bulat (Rupiah).")
    .positive("Starting price harus lebih dari 0.")
    .max(1e13, "Starting price melebihi batas yang diizinkan."),

  commitDurationHours: durationHours("Durasi commit"),
  revealDurationHours: durationHours("Durasi reveal"),
}, BAD_BODY);

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
/** Skema perubahan informasi lelang (khusus admin). */
export const updateAuctionSchema = z.object({
  title: text("Judul")
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(150, "Judul maksimal 150 karakter."),

  perfumeHouse: text("Rumah parfum")
    .trim()
    .min(2, "Rumah parfum minimal 2 karakter.")
    .max(100, "Rumah parfum maksimal 100 karakter."),

  startingPrice: z.coerce
    .number({ error: "Starting price harus berupa angka." })
    .int("Starting price harus berupa bilangan bulat (Rupiah).")
    .min(100000, "Starting price minimal Rp100.000.")
    .max(1e13, "Starting price melebihi batas yang diizinkan."),
}, BAD_BODY);

export type UpdateAuctionInput = z.infer<typeof updateAuctionSchema>;