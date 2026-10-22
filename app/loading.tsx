export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white"
          role="status"
          aria-label="Memuat halaman"
        />
        <p className="text-sm text-zinc-400">
          Menyiapkan koleksi parfum...
        </p>
      </div>
    </main>
  );
}
