"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="mb-3 text-xl font-semibold">
          Terjadi Kesalahan
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          Halaman belum dapat ditampilkan. Silakan coba lagi.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-white px-5 py-2 text-sm font-medium text-black"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
