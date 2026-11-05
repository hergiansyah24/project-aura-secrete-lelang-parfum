
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Memerlukan hak akses Admin." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Pilih gambar terlebih dahulu." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Format gambar harus JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran gambar maksimal 5 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Periksa signature file, bukan hanya MIME type dari browser.
    const validSignature =
      (file.type === "image/jpeg" &&
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff) ||
      (file.type === "image/png" &&
        bytes.length >= 8 &&
        bytes.subarray(0, 8).equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        )) ||
      (file.type === "image/webp" &&
        bytes.length >= 12 &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP");

    if (!validSignature) {
      return NextResponse.json(
        { error: "Isi file tidak cocok dengan format gambar." },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "perfumes");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), bytes, { flag: "wx" });

    return NextResponse.json({
      success: true,
      imageUrl: `/uploads/perfumes/${filename}`,
    });
  } catch (error) {
    console.error("Upload perfume image error:", error);

    return NextResponse.json(
      { error: "Gagal mengunggah gambar." },
      { status: 500 }
    );
  }
}
