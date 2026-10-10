# AI_LOG.md

## Catatan Pemanfaatan AI

**Proyek:** Aura Secrete - Aplikasi Lelang Parfum
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