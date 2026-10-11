# STRIDE Threat Analysis - Sealed Bid (my project)

## 1. Tujuan

Analisis STRIDE digunakan untuk mengidentifikasi ancaman keamanan pada aplikasi Sealed Bid berdasarkan komponen, aliran data, dan batas kepercayaan yang dijelaskan dalam `dfd.md`.

STRIDE terdiri dari enam kategori:

- **S â€” Spoofing:** penyamaran identitas pengguna atau sistem.
- **T â€” Tampering:** perubahan data tanpa izin.
- **R â€” Repudiation:** penyangkalan aktivitas yang tidak dapat dibuktikan secara memadai.
- **I â€” Information Disclosure:** pengungkapan informasi kepada pihak yang tidak berwenang.
- **D â€” Denial of Service:** gangguan yang membuat layanan tidak tersedia.
- **E â€” Elevation of Privilege:** peningkatan hak akses tanpa izin.

Ancaman di bawah merupakan skenario yang perlu diperiksa. Pencantuman suatu ancaman tidak otomatis berarti aplikasi terbukti rentan.

## 2. Daftar Ancaman STRIDE

| ID | Kategori | Komponen yang Terdampak | Ancaman | Aset Terdampak |
|---|---|---|---|---|
| T01 | Spoofing | `P04` — autentikasi, aliran `F02` | Penyerang menggunakan token sesi yang dicuri untuk menyamar sebagai pengguna yang sah. | A01, A04 |
| T02 | Spoofing | `P03`, `P04` — endpoint API dan autentikasi | Server menerima identitas pengguna yang tidak diverifikasi dengan benar. | A01, A04 |
| T03 | Tampering | `P02`, `D01`, `D02` — kriptografi sisi klien dan penyimpanan bukti | Pengguna mengubah bukti penawaran lokal atau file JSON sebelum proses reveal. | A06, A07, A08 |
| T04 | Tampering | `P03`, `D03` — endpoint API dan database | Permintaan yang dimanipulasi mencoba mengubah nilai penawaran, status lelang, atau data pengguna lain. | A05, A06, A07 |
| T05 | Repudiation | `P06`, `D03` — audit dan database | Pengguna menyangkal aktivitas karena catatan audit tidak cukup untuk membuktikan siapa melakukan tindakan dan kapan. | A10 |
| T06 | Repudiation | `P03`, `P06`, `D03` — API, audit, dan database | Perubahan data penting tidak tercatat secara lengkap sehingga sulit ditelusuri. | A05, A06, A10 |
| T07 | Information Disclosure | `D01`, `D02` — bukti di browser dan file JSON | Pihak lain yang mendapat akses ke browser atau file dapat membaca nilai penawaran dan nonce sebelum reveal. | A08 |
| T08 | Information Disclosure | `D03` — database SQLite | Pihak yang memperoleh akses ke file database dapat membaca data yang tidak terenkripsi atau metadata sensitif. | A01, A03, A05, A06, A11 |
| T09 | Denial of Service | `P03` — endpoint API | Permintaan otomatis dalam jumlah besar menghabiskan sumber daya server dan mengganggu pengguna sah. | A05, A06 |
| T10 | Denial of Service | `P03`, `D03` — API dan SQLite | Operasi database yang berlebihan atau transaksi yang saling menunggu dapat memperlambat atau menghentikan layanan. | A05, A06, A11 |
| T11 | Elevation of Privilege | `P03`, `P04` — API dan autentikasi | Pengguna biasa mencoba menjalankan fungsi yang seharusnya hanya tersedia bagi administrator. | A01, A05 |
| T12 | Elevation of Privilege | `P03`, `D03` — API dan database | Pengguna mencoba membaca atau mengubah penawaran milik pengguna lain dengan mengganti identifier pada permintaan. | A01, A06 |

## 3. Analisis Ancaman Berdasarkan Kategori

### 3.1 Spoofing

**T01_Penyalahgunaan token sesi**

Jika token sesi pengguna berhasil dicuri, penyerang dapat mencoba menggunakannya untuk mengakses fungsi yang tersedia bagi pengguna tersebut.

- **Pemeriksaan:** pastikan cookie sesi memiliki konfigurasi keamanan yang sesuai, token diverifikasi di server, dan masa berlaku sesi dibatasi.
- **Indikator pengujian:** token yang tidak valid atau sudah kedaluwarsa harus ditolak.

**T02_Identitas pengguna tidak diverifikasi dengan benar**

Jika endpoint mempercayai identitas yang dikirim oleh browser tanpa memverifikasi sesi, pengguna berpotensi menyamar sebagai pengguna lain.

- **Pemeriksaan:** pastikan identitas untuk operasi yang memerlukan autentikasi berasal dari sesi yang telah diverifikasi server.
- **Indikator pengujian:** mengganti identifier pengguna pada permintaan tidak boleh mengubah identitas yang digunakan server.

### 3.2 Tampering

**T03_Manipulasi bukti penawaran**

Pengguna dapat mengubah file JSON atau data localStorage miliknya. Perubahan tersebut menjadi ancaman apabila server menerima bukti yang tidak cocok dengan commitment awal.

- **Pemeriksaan:** verifikasi nilai penawaran dan nonce terhadap commitment yang tersimpan di server.
- **Indikator pengujian:** bukti yang dimodifikasi harus gagal diverifikasi.

**T04 Manipulasi permintaan API**

Penyerang dapat mengirim parameter yang berbeda dari antarmuka normal untuk mencoba mengubah data atau melewati aturan lelang.

- **Pemeriksaan:** validasi input, status lelang, identitas pemilik, dan izin operasi di server.
- **Indikator pengujian:** permintaan yang melanggar aturan harus ditolak tanpa mengubah data.

### 3.3 Repudiation

**T05_Aktivitas sulit dibuktikan**

Jika log tidak mencatat informasi penting atau identitas pelaku secara memadai, investigasi terhadap sengketa lelang akan sulit dilakukan.

- **Pemeriksaan:** pastikan aktivitas penting seperti login, commit, reveal, dan perubahan administrasi dicatat dengan waktu serta identitas yang sesuai.
- **Indikator pengujian:** aktivitas uji dapat ditelusuri melalui log tanpa merekam password, secret, atau nonce sensitif secara tidak perlu.

**T06_perubahan penting tidak tercatat**

Perubahan status lelang atau hasil penawaran yang tidak memiliki catatan audit memadai dapat menyulitkan penelusuran kesalahan dan penyalahgunaan.

- **Pemeriksaan:** tentukan perubahan apa saja yang wajib dicatat dan batasi akses terhadap log.
- **Indikator pengujian:** setiap perubahan penting memiliki catatan yang dapat ditelusuri.

### 3.4 Information Disclosure

**T07_Kebocoran bukti penawaran**

Bukti yang disimpan di browser atau file JSON dapat dibaca pihak yang memperoleh akses ke perangkat atau file tersebut.

- **Pemeriksaan:** tinjau isi bukti, cara penyimpanan, dan kapan informasi penawaran dapat diungkap.
- **Indikator pengujian:** pastikan bukti tidak terkirim ke pengguna lain atau ditampilkan sebelum waktu reveal yang sah.

**T08_Kebocoran database**

File SQLite atau salinan cadangannya dapat mengungkap data sensitif jika pihak yang tidak berwenang berhasil membacanya.

- **Pemeriksaan:** periksa izin file, lokasi penyimpanan, akses cadangan, dan kolom yang benar-benar dienkripsi.
- **Indikator pengujian:** file database tidak dapat diakses melalui URL publik atau akun sistem yang tidak berwenang.

### 3.5 Denial of Service

**T09_Permintaan API berlebihan**

Permintaan login, commit, atau reveal dalam jumlah besar dapat menghabiskan sumber daya aplikasi.

- **Pemeriksaan:** tinjau rate limiting pada endpoint terkait dan batas ukuran input.
- **Indikator pengujian:** permintaan berlebihan dibatasi tanpa menghalangi penggunaan normal secara tidak wajar.

**T10_Beban database berlebihan**

Operasi database yang berlebihan dapat menimbulkan antrean, konflik transaksi, atau keterlambatan respons.

- **Pemeriksaan:** tinjau penggunaan transaksi, batas waktu, dan penanganan kegagalan database.
- **Indikator pengujian:** beban uji yang terkendali tidak menyebabkan layanan terus-menerus gagal atau kehilangan konsistensi data.

### 3.6 Elevation of Privilege

**T11_Pengguna biasa menjalankan fungsi administrator**

Pengguna dapat mencoba mengakses endpoint administrasi secara langsung meskipun antarmuka tidak menampilkan fungsi tersebut.

- **Pemeriksaan:** setiap endpoint administratif harus memeriksa peran pengguna di server.
- **Indikator pengujian:** akun bidder tidak dapat menjalankan fungsi khusus administrator.

**T12_Akses terhadap penawaran milik pengguna lain**

Pengguna dapat mencoba mengganti ID penawaran pada permintaan untuk membaca atau mengubah data milik akun lain.

- **Pemeriksaan:** server harus memverifikasi kepemilikan data pada setiap operasi yang memerlukan pembatasan berdasarkan pengguna.
- **Indikator pengujian:** akun pertama tidak dapat mengakses atau mengubah penawaran akun kedua tanpa izin yang sah.

## 4. Prioritas Pemeriksaan

Ancaman berikut perlu mendapat perhatian awal karena berhubungan langsung dengan kerahasiaan penawaran dan kendali atas data:

1. **T07:** kebocoran bukti penawaran.
2. **T01 dan T02:** penyalahgunaan atau pemalsuan identitas sesi.
3. **T04 dan T12:** perubahan data serta akses penawaran tanpa izin.
4. **T08:** akses langsung ke database.
5. **T09 dan T10:** gangguan ketersediaan layanan.
6. **T05 dan T06:** kelengkapan dan keandalan catatan audit.

Urutan ini merupakan urutan pemeriksaan awal. Prioritas risiko akhir ditentukan setelah likelihood dan impact dinilai pada `risk_register.md`.

## 5. Kesimpulan

Analisis STRIDE menghasilkan 12 skenario ancaman yang mencakup keenam kategori STRIDE. Setiap ancaman dihubungkan dengan komponen aplikasi dan aset yang berpotensi terdampak.

Ancaman yang belum terbukti harus diuji melalui pemeriksaan kode atau pengujian keamanan yang terkontrol. Hasil pemeriksaan tersebut digunakan untuk menentukan risiko prioritas dan memilih kontrol keamanan yang tepat.
