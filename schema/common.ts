import { z } from "zod";

/**
 * Helper bersama untuk semua skema zod di folder `schema/`.
 * Tidak mengimpor modul server (db, auth, crypto) -> aman dipakai di server & browser.
 */

/** String wajib. `label` dipakai untuk pesan jika field kosong / bukan teks. */
export const text = (label: string) =>
  z.string({ error: `${label} wajib diisi.` });

/** Kosong / null dianggap "tidak diisi" -> undefined (agar `.default()` bekerja). */
/** Pesan jika isi request bukan objek JSON (null, array, JSON rusak). */
export const BAD_BODY = { error: "Data permintaan tidak valid." };

export const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

/** Teks opsional: kosong -> memakai nilai bawaan, panjang dibatasi. */
export const optionalText = (label: string, max: number, fallback: string) =>
  z
    .string({ error: `${label} harus berupa teks.` })
    .trim()
    .max(max, `${label} maksimal ${max} karakter.`)
    .nullish()
    .transform((value) => value || fallback);

/** Ambil pesan error pertama (untuk respons API: { error: "..." }). */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Input tidak valid.";
}

/** Error per-field (untuk menampilkan pesan di bawah input pada form). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
