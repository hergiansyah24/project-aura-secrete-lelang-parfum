import { z } from "zod";
import { text, BAD_BODY } from "./common.ts";

/** Skema autentikasi: register & login. */

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;

/** bcrypt hanya memakai 72 byte pertama password; lebih dari itu diabaikan diam-diam. */
const BCRYPT_MAX_BYTES = 72;
const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const registerSchema = z.object({
  username: text("Username")
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(
      USERNAME_PATTERN,
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan strip."
    )
    .transform((value) => value.toLowerCase()),

  email: text("Email")
    .trim()
    .max(254, "Email terlalu panjang.")
    .toLowerCase()
    .pipe(z.email("Format email tidak valid.")),

  password: text("Password")
    .min(8, "Password minimal 8 karakter.")
    .regex(/[A-Za-z]/, "Password harus mengandung minimal satu huruf.")
    .regex(/\d/, "Password harus mengandung minimal satu angka.")
    .refine(
      (value) => byteLength(value) <= BCRYPT_MAX_BYTES,
      `Password terlalu panjang (maksimal ${BCRYPT_MAX_BYTES} byte).`
    ),

  // Data profil bersifat opsional di server (kompatibel dengan API lama),
  // tetapi jika diisi harus valid. Nilainya kelak dienkripsi AES-256-GCM.
  fullName: z
    .string({ error: "Nama lengkap harus berupa teks." })
    .trim()
    .max(100, "Nama lengkap maksimal 100 karakter.")
    .nullish()
    .transform((value) => value ?? ""),

  phone: z
    .string({ error: "Nomor telepon harus berupa teks." })
    .trim()
    .nullish()
    .transform((value) => value ?? "")
    .refine(
      (value) => value === "" || PHONE_PATTERN.test(value),
      "Nomor telepon tidak valid (6-20 karakter: angka, +, -, spasi, tanda kurung)."
    ),

  address: z
    .string({ error: "Alamat harus berupa teks." })
    .trim()
    .max(300, "Alamat maksimal 300 karakter.")
    .nullish()
    .transform((value) => value ?? ""),
}, BAD_BODY);

export const loginSchema = z.object({
  identifier: text("Username/Email")
    .trim()
    .min(1, "Username/Email dan password harus diisi.")
    .max(254, "Username/Email terlalu panjang.")
    .transform((value) => value.toLowerCase()),

  // Tidak memakai aturan kekuatan password di sini: login hanya membandingkan hash.
  password: z
    .string({ error: "Username/Email dan password harus diisi." })
    .min(1, "Username/Email dan password harus diisi.")
    .max(128, "Password terlalu panjang."),
}, BAD_BODY);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
