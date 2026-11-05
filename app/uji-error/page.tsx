"use client";

export default function UjiErrorPage() {
  function handleTestError() {
    throw new Error("Error pengujian Modul 4");
  }

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">
        Pengujian Error Boundary
      </h1>

      <p className="mt-2">
        Klik tombol berikut untuk menguji error.tsx.
      </p>

      <button
        onClick={handleTestError}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white"
      >
        Uji Error
      </button>
    </main>
  );
}