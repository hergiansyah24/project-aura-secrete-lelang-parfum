import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-3xl font-semibold">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Halaman yang kamu cari tidak tersedia.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-white px-5 py-2 text-sm font-medium text-black"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
