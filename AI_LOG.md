# AI_LOG.md

## Catatan Pemanfaatan AI

**Proyek:** Aura Secrète - Aplikasi/website Lelang Parfum
**Mata kuliah:** Keamanan Komputasi dan Siber
**Milestone:** sec-0.1

### 1. Alat yang digunakan
ChatGPT digunakan sebagai alat bantu untuk memahami ancaman keamanan, menyusun dokumentasi, meninjau kode, dan membantu proses perbaikan keamanan aplikasi.

### 2. Bagian yang dibantu AI
- Inventaris aset dan data aplikasi.
- Penyusunan arsitektur dan aliran data beserta trust boundary.
- Identifikasi ancaman menggunakan metode STRIDE.
- Penilaian risiko dan pemilihan lima risiko prioritas.
- Penyusunan rencana kontrol keamanan dan checklist pengujian.
- Peninjauan konfigurasi JWT dan enkripsi data pengguna.
- Panduan migrasi kunci enkripsi untuk mempertahankan akses ke data pengguna yang sudah tersimpan.

### 3. Perintah dan bentuk bantuan utama
AI digunakan untuk meminta penjelasan konsep keamanan, contoh dokumentasi, peninjauan potongan kode, dan panduan langkah demi langkah untuk menjalankan serta memeriksa perubahan aplikasi.

### 4. Pemeriksaan dan perubahan oleh pengembang
Pengembang menerapkan perubahan pada proyek, memeriksa konfigurasi environment, membuat backup database, menjalankan migrasi enkripsi, dan menguji login serta tampilan data pengguna pada halaman admin.

Hasil pengujian yang diamati menunjukkan login berhasil dan data pengguna tampil normal setelah migrasi. Pengujian ini tidak berarti seluruh aspek keamanan aplikasi telah terjamin.

### 5. Tanggung jawab dan keterbatasan
AI digunakan sebagai alat bantu, bukan pengganti penilaian pengembang. Isi dokumentasi dan kode tetap perlu ditinjau agar sesuai dengan implementasi proyek, hasil pengujian, dan kebutuhan tugas. Pengembang bertanggung jawab atas keputusan, perubahan, serta hasil akhir yang dikumpulkan.

Tidak ada nilai secret dari `.env.local` yang dicantumkan dalam dokumen ini.

---

## Catatan Pemanfaatan AI — Tugas 1 Kriptografi

**Mata kuliah:** Kriptografi  
**Tugas:** Fondasi dan Komponen Dasar Kriptografi  
**Proyek:** Aura Secrète — Aplikasi Lelang Parfum dengan Mekanisme Sealed Bid

### 1. Bagian yang Dibantu AI

ChatGPT digunakan sebagai alat bantu untuk:
- Meninjau implementasi enkripsi dan dekripsi data menggunakan AES-256-GCM.
- Memahami fungsi SHA-256 dalam pembuatan dan verifikasi commitment hash.
- Meninjau penggunaan nonce acak dan fungsi verifikasi commitment.
- Menyusun serta memperbaiki dokumentasi komponen kriptografi pada `crypto/README.md`.
- Menyusun skenario pengujian otomatis pada `tests/crypto.test.ts`.
- Menafsirkan hasil pengujian dan membedakan kegagalan pengujian dari pesan log atau warning Node.js.

### 2. Bentuk Bantuan yang Digunakan

Bantuan diberikan melalui permintaan penjelasan kode, peninjauan potongan implementasi, penyusunan dokumentasi, dan panduan menjalankan pengujian menggunakan Node.js Test Runner.

Pengujian mencakup enkripsi dan dekripsi, penanganan ciphertext yang dimodifikasi, verifikasi commitment, ketidakcocokan nilai bid, format nonce, serta batas input berupa teks kosong.

### 3. Pemeriksaan oleh Pengembang

Pengembang menjalankan perintah `npm run test:crypto` menggunakan `ENCRYPTION_SECRET` dari environment lokal.

Hasil pengujian terakhir yang diamati menunjukkan **6 tes lolos dan 0 tes gagal**. Hasil tersebut mencakup pengujian negatif terhadap ciphertext yang dimodifikasi dan pengujian batas input kosong.

Hasil ini hanya menunjukkan keberhasilan skenario yang diuji. Hasil tersebut bukan bukti bahwa seluruh komponen dan alur keamanan aplikasi telah terjamin.

### 4. Keterbatasan dan Tanggung Jawab

Saran AI perlu diperiksa kembali terhadap kode, dokumentasi, dan hasil pengujian yang sebenarnya. Pengembang bertanggung jawab memahami fungsi enkripsi, hashing, nonce, commitment, pengelolaan secret, serta dampak perubahan kode sebelum mengumpulkan tugas.

AI tidak menggantikan pengujian mandiri maupun evaluasi keamanan menyeluruh. Secret produksi, token autentikasi, private key, dan data pribadi tidak boleh dicantumkan dalam dokumentasi atau catatan pemanfaatan AI.