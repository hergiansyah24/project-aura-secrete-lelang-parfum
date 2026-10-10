# Checklist Pengujian Keamanan

## 1. Tujuan Pengujian

Pengujian ini dilakukan untuk memeriksa keamanan aplikasi lelang parfum dengan sistem penawaran tertutup (*sealed bid*). Pengujian berfokus pada autentikasi, otorisasi, perlindungan data penawaran, pengelolaan secret, dan pencatatan aktivitas.

Pengujian dilakukan pada lingkungan lokal atau pengembangan menggunakan akun dan data dummy. Hasil pengujian dicatat sebagai bukti pendukung analisis keamanan.

## 2. Daftar Pengujian

| ID | Area Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-01 | Autentikasi | Login dengan kata sandi yang salah | Login ditolak | Belum diuji |
| TC-02 | Session | Mengakses endpoint yang memerlukan login tanpa session | Akses ditolak | Belum diuji |
| TC-03 | Otorisasi | Akun bidder mencoba mengakses fungsi khusus admin | Akses ditolak | Belum diuji |
| TC-04 | Privasi penawaran | Bidder mencoba melihat penawaran milik bidder lain | Data penawaran tidak dapat diakses | Belum diuji |
| TC-05 | Integritas penawaran | Mengubah data penawaran setelah bukti komitmen dibuat | Perubahan terdeteksi atau verifikasi gagal | Belum diuji |
| TC-06 | Secret aplikasi | Memeriksa apakah secret memiliki nilai cadangan yang tetap di kode | Secret sensitif tidak menggunakan nilai cadangan yang tidak aman | Belum diuji |
| TC-07 | Randomness | Memeriksa proses pembuatan nonce penawaran | Menggunakan sumber acak kriptografis | Belum diuji |
| TC-08 | Penyimpanan | Memeriksa perlindungan database dan file backup | File hanya dapat diakses oleh pihak yang berwenang | Belum diuji |
| TC-09 | Audit log | Melakukan aktivitas pengujian yang seharusnya dicatat | Log merekam aktivitas penting tanpa membocorkan data sensitif | Belum diuji |
| TC-10 | Rate limiting | Mengirim beberapa permintaan login gagal secara berurutan | Permintaan dibatasi sesuai konfigurasi | Belum diuji |

## 3. Bukti Pengujian

Untuk setiap pengujian, catat informasi berikut:

- ID pengujian.
- Tanggal pengujian.
- File atau endpoint yang diperiksa.
- Langkah pengujian.
- Hasil aktual.
- Status: Lulus, Gagal, atau Belum Diuji.
- Bukti berupa tangkapan layar atau potongan kode yang relevan.

## 4. Kriteria Penilaian

- **Lulus:** Hasil aktual sesuai dengan hasil yang diharapkan.
- **Gagal:** Hasil aktual tidak sesuai dengan hasil yang diharapkan.
- **Belum Diuji:** Pengujian belum dilakukan atau belum memiliki bukti yang cukup.

## 5. Catatan

Daftar pengujian ini merupakan rencana awal. Hasil dan status harus diperbarui berdasarkan pemeriksaan kode serta pengujian nyata. Pengujian yang belum dilakukan tidak boleh dinyatakan berhasil.

Pengujian dilakukan menggunakan data dummy pada lingkungan lokal atau pengembangan, bukan terhadap sistem pihak lain tanpa izin.
