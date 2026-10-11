# Security Controls Plan - Sealed Bid (my project)

## 1. Tujuan

Dokumen ini menjelaskan kontrol keamanan yang direncanakan untuk mengurangi lima risiko prioritas pada aplikasi Sealed Bid. Setiap kontrol dilengkapi dengan tujuan, langkah mitigasi, dan metode pengujian untuk mengevaluasi efektivitasnya.

Kontrol yang dijelaskan di bawah merupakan rencana perbaikan. Kontrol baru dapat dinyatakan telah diterapkan setelah perubahan kode atau konfigurasi dilakukan dan hasil pengujiannya dicatat.

## 2. Rencana Kontrol Keamanan

### R01_Secret Kriptografi Bocor atau Dikelola Tidak Aman

**Ancaman:** Secret kriptografi dapat terekspos atau dikelola secara tidak aman, sehingga berpotensi mengancam keamanan token sesi dan data terenkripsi.

**Kontrol yang direncanakan:**

1. Simpan `ENCRYPTION_SECRET` dan `JWT_SECRET` melalui environment variable atau pengelola secret yang sesuai.
2. Pastikan secret tidak disimpan dalam repositori atau dikirim ke log.
3. Gunakan secret acak yang kuat dan berbeda untuk fungsi yang berbeda.
4. Hentikan startup aplikasi dengan aman apabila secret wajib tidak tersedia atau tidak memenuhi validasi.
5. Jika secret diduga telah terekspos, lakukan rotasi secret dan evaluasi dampaknya terhadap data serta sesi yang sudah ada.

### R02_Nonce Menggunakan `Math.random()`

**Ancaman:** Nonce yang mudah diprediksi dapat mengurangi perlindungan kerahasiaan commitment.

**Kontrol yang direncanakan:**

1. Gunakan Web Crypto API, seperti `crypto.getRandomValues()`, untuk menghasilkan nonce.
2. Hapus fallback `Math.random()` dari proses pembuatan nonce.
3. Jika sumber acak kriptografis tidak tersedia, hentikan pembuatan commitment dan tampilkan pesan kesalahan.
4. Pastikan nonce memiliki panjang yang memadai dan format yang konsisten ketika disimpan atau digunakan kembali untuk reveal.

**Tujuan kontrol:** Menjaga agar nonce sulit diprediksi dan membantu mempertahankan kerahasiaan nilai penawaran sebelum reveal.

**Metode pengujian:**

- Periksa fungsi pembuatan nonce di `lib/client-crypto.ts`.
- Pastikan tidak ada jalur fallback nonkriptografis.
- Simulasikan kondisi ketika sumber acak yang aman tidak tersedia dan pastikan proses gagal secara aman.

**Kriteria keberhasilan:** Commitment tidak dibuat menggunakan nonce yang berasal dari `Math.random()`.

### R03_Kebocoran Bukti Penawaran

**Ancaman:** Nilai penawaran dan nonce dalam localStorage atau file JSON dapat diakses pihak lain.

**Kontrol yang direncanakan:**

1. Minimalkan data sensitif yang ditampilkan atau dikirim sebelum waktu reveal.
2. Berikan peringatan kepada pengguna agar tidak membagikan file bukti penawaran.
3. Hindari menyimpan bukti penawaran di lokasi yang dapat diakses oleh pengguna lain pada perangkat bersama.
4. Validasi commitment di server ketika proses reveal dilakukan.
5. Pastikan nilai penawaran dan nonce tidak ditulis ke log aplikasi secara tidak perlu.

**Tujuan kontrol:** Mengurangi kemungkinan kebocoran bukti dan mendeteksi bukti yang tidak sesuai dengan commitment awal.

**Metode pengujian:**

- Periksa isi localStorage dan file JSON yang dihasilkan aplikasi.
- Pastikan perubahan pada nilai penawaran atau nonce menyebabkan verifikasi commitment gagal.
- Periksa respons API dan log untuk memastikan data sensitif tidak diungkapkan secara tidak perlu.

**Kriteria keberhasilan:** Bukti yang dimodifikasi tidak diterima sebagai penawaran valid, dan data sensitif tidak dibocorkan oleh respons API atau log.

**Catatan:** Validasi commitment menjaga integritas bukti, tetapi tidak dapat mencegah pengguna yang memiliki akses ke file bukti asli membocorkan isinya. Kerahasiaan penyimpanan tetap diperlukan.

### R04_Akses Database Tanpa Izin

**Ancaman:** Database SQLite atau salinan cadangannya dapat diakses pihak yang tidak berwenang.

**Kontrol yang direncanakan:**

1. Simpan database di lokasi server yang tidak dapat diakses langsung melalui URL publik.
2. Batasi izin baca dan tulis file database kepada akun sistem yang memerlukan akses.
3. Terapkan kontrol akses yang setara terhadap file cadangan.
4. Pastikan informasi sensitif yang perlu dilindungi benar-benar dienkripsi dengan pengelolaan kunci yang aman.
5. Lakukan pencadangan berkala dan uji pemulihan data.

**Tujuan kontrol:** Mengurangi kemungkinan akses langsung tanpa izin dan membatasi dampak kehilangan atau perubahan data.

**Metode pengujian:**

- Pastikan file database tidak dapat diunduh melalui browser.
- Periksa izin akses file pada lingkungan deployment.
- Pastikan akun yang tidak berwenang tidak dapat membaca atau mengubah database.
- Uji pemulihan dari salinan cadangan.

**Kriteria keberhasilan:** Database dan cadangannya hanya dapat diakses oleh pihak yang memiliki izin yang sesuai.

### R05_Kredensial Akun Demo pada Produksi

**Ancaman:** Akun demo dengan kredensial yang diketahui publik dapat disalahgunakan apabila masih aktif pada lingkungan produksi.

**Kontrol yang direncanakan:**

1. Pisahkan proses seed akun demo dari konfigurasi produksi.
2. Nonaktifkan pembuatan akun demo pada lingkungan produksi.
3. Hapus atau nonaktifkan akun demo yang tidak lagi diperlukan.
4. Pastikan akun administrator produksi menggunakan kredensial unik dan kuat.
5. Periksa hak akses akun demo dan batasi perannya sesuai kebutuhan pengujian.

**Tujuan kontrol:** Mengurangi kemungkinan penyamaran sebagai akun demo dan mencegah penyalahgunaan hak akses.

**Metode pengujian:**

- Jalankan proses inisialisasi pada konfigurasi produksi dan pastikan akun demo tidak dibuat.
- Periksa apakah akun demo yang tidak diperlukan masih aktif.
- Pastikan akun dengan hak bidder tidak dapat menjalankan fungsi administrator.

**Kriteria keberhasilan:** Kredensial demo yang diketahui publik tidak dapat digunakan untuk masuk ke lingkungan produksi.

## 3. Ringkasan Kontrol dan Pengujian

| ID Risiko | Kontrol Utama | Bukti Pengujian |
|---|---|---|
| R01 | Pengelolaan secret dan kegagalan konfigurasi yang aman | Hasil pengujian startup tanpa secret dan pemeriksaan repositori |
| R02 | Penggunaan sumber acak kriptografis | Pemeriksaan kode dan pengujian jalur kegagalan |
| R03 | Perlindungan bukti dan verifikasi commitment | Hasil pengujian bukti yang dimodifikasi serta pemeriksaan respons dan log |
| R04 | Pembatasan akses database dan cadangan | Pemeriksaan izin file dan pengujian akses |
| R05 | Pemisahan akun demo dari produksi | Hasil pemeriksaan proses seed dan autentikasi akun |

## 4. Pemetaan Rencana Kontrol ke Tugas Berikutnya

Pemetaan berikut merupakan rencana awal untuk menghubungkan lima risiko prioritas dengan kegiatan pada tugas berikutnya. Pemetaan ini perlu disesuaikan apabila instruksi resmi Tugas 2 dan Tugas 3 menetapkan pembagian yang berbeda.

| ID Risiko | Fokus Kontrol | Rencana Pemetaan | Bukti yang Diharapkan |
|---|---|---|---|
| R01 | Pengelolaan secret dan konfigurasi aman | Tugas 2 | Pemeriksaan konfigurasi secret dan pengujian aplikasi tanpa secret yang valid |
| R02 | Penggunaan nonce yang aman secara kriptografis | Tugas 2 | Pemeriksaan implementasi nonce dan pengujian ketika Web Crypto tidak tersedia |
| R03 | Kerahasiaan bukti penawaran dan verifikasi commitment | Tugas 3 | Pengujian perubahan bukti dan pemeriksaan validasi commitment |
| R04 | Pembatasan akses database dan cadangan | Tugas 3 | Pemeriksaan izin file database dan pembatasan akses |
| R05 | Pemisahan akun demo dari lingkungan produksi | Tugas 2 | Pemeriksaan konfigurasi seed dan pengujian autentikasi akun demo |

Pemetaan di atas masih berupa rencana, bukan pernyataan bahwa seluruh kontrol sudah diterapkan atau diuji. Pelaksanaan akhirnya mengikuti ruang lingkup dan instruksi resmi masing-masing tugas.

## 5. Hubungan dengan STRIDE

| Kategori STRIDE | Kontrol yang Relevan |
|---|---|
| Spoofing | Pengelolaan secret, validasi sesi, dan pengamanan kredensial |
| Tampering | Validasi input, pemeriksaan commitment, dan pembatasan akses database |
| Repudiation | Pencatatan aktivitas penting dan perlindungan integritas log |
| Information Disclosure | Perlindungan bukti penawaran, secret, dan database |
| Denial of Service | Rate limiting, pembatasan input, dan penanganan beban database |
| Elevation of Privilege | Pemeriksaan peran dan kepemilikan data di sisi server |

Kontrol pada tabel ini mencakup rencana keamanan yang lebih luas. Untuk lima risiko prioritas, penerapan dan pengujian tetap mengikuti rincian R01–R05 di atas.

## 6. Kesimpulan

Rencana kontrol keamanan difokuskan pada pengelolaan secret, kualitas nonce, kerahasiaan bukti penawaran, pembatasan akses database, dan pengamanan akun demo. Setiap kontrol memiliki metode pengujian agar efektivitasnya dapat dinilai berdasarkan bukti.

Status kontrol harus diperbarui setelah implementasi dan pengujian selesai. Kontrol yang baru direncanakan tidak boleh dinyatakan berhasil sebelum ada bukti yang mendukungnya.