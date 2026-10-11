# Risk Assessment - Sealed Bid (my project)

## 1. Tujuan

Risk assessment dilakukan untuk menentukan risiko keamanan yang perlu diprioritaskan pada aplikasi Sealed Bid, yaitu aplikasi lelang parfum langka dengan mekanisme penawaran tertutup.

Penilaian menggunakan dua faktor, yaitu likelihood atau kemungkinan terjadinya ancaman dan impact atau besarnya dampak terhadap aplikasi, data pengguna, dan keadilan proses lelang.

Nilai yang dicantumkan merupakan penilaian awal berdasarkan arsitektur dan temuan kode yang telah diidentifikasi. Nilai perlu diperbarui berdasarkan hasil pengujian serta konfigurasi deployment yang sebenarnya.

## 2. Skala Penilaian

### Likelihood

| Nilai | Kategori | Penjelasan |
|---|---|---|
| 1 | Sangat rendah | Membutuhkan kondisi yang sangat khusus. |
| 2 | Rendah | Membutuhkan kondisi tertentu sebelum dapat terjadi. |
| 3 | Sedang | Dapat terjadi jika kelemahan terkait memang ada. |
| 4 | Tinggi | Relatif mudah dilakukan jika kelemahan tersedia. |
| 5 | Sangat tinggi | Sangat mudah dilakukan dan berpeluang sering terjadi. |

### Impact

| Nilai | Kategori | Penjelasan |
|---|---|---|
| 1 | Sangat rendah | Dampak hampir tidak mengganggu fungsi aplikasi. |
| 2 | Rendah | Mengganggu sebagian kecil fungsi. |
| 3 | Sedang | Mengganggu fungsi penting atau sebagian pengguna. |
| 4 | Tinggi | Mengganggu keamanan data atau keadilan lelang secara signifikan. |
| 5 | Sangat tinggi | Mengancam kerahasiaan penawaran, data sensitif, atau integritas proses lelang secara serius. |

### Perhitungan Risiko

**Risk Score = Likelihood Ã— Impact**

| Skor | Tingkat Risiko |
|---|---|
| 1â€“4 | Rendah |
| 5â€“9 | Sedang |
| 10â€“16 | Tinggi |
| 17â€“25 | Sangat tinggi |

## 3. Daftar Lima Risiko Prioritas

| ID | Ancaman | Likelihood | Impact | Skor | Tingkat |
|---|---|---:|---:|---:|---|
| R01 | Secret bawaan digunakan ketika konfigurasi rahasia tidak tersedia. | 3 | 5 | 15 | Tinggi |
| R02 | Nonce dibuat menggunakan fallback `Math.random()`. | 2 | 4 | 8 | Sedang |
| R03 | Bukti penawaran pada browser atau file JSON diakses pihak lain. | 3 | 5 | 15 | Tinggi |
| R04 | Data sensitif pada database atau cadangannya diakses tanpa izin. | 2 | 5 | 10 | Tinggi |
| R05 | Kredensial akun demo tetap aktif pada lingkungan produksi. | 2 | 5 | 10 | Tinggi |

**Catatan:** Skor tersebut adalah estimasi awal, bukan hasil pengukuran empiris. R01 dan R02 berkaitan dengan perilaku yang terlihat pada kode, sedangkan risiko R03â€“R05 bergantung pada kondisi akses, konfigurasi, dan deployment. Nilai likelihood harus disesuaikan setelah kondisi tersebut diverifikasi.

## 4. Analisis Setiap Risiko

### R01 Secret Kriptografi Bocor atau Dikelola Tidak Aman

**Komponen:** `lib/crypto.ts`, `lib/auth.ts`, konfigurasi environment

**Kategori STRIDE:** Spoofing dan Information Disclosure

- **Likelihood: 2 (Rendah, sementara).** Kode sudah memvalidasi keberadaan dan panjang minimum secret. Namun, risiko kebocoran melalui konfigurasi deployment, akses lingkungan, atau pengelolaan secret tetap perlu diperiksa.
- **Impact: 5 (Sangat tinggi).** Jika secret yang aktif berhasil diperoleh pihak lain, perlindungan token sesi atau data terenkripsi yang bergantung pada secret tersebut dapat terancam.
- **Alasan prioritas:** Secret merupakan komponen penting dalam autentikasi dan perlindungan data sensitif.
### R02 Nonce dengan Fallback `Math.random()`

**Komponen:** `lib/client-crypto.ts`

**Kategori STRIDE:** Information Disclosure

- **Likelihood: 2 (Rendah).** Risiko bergantung pada apakah browser menjalankan jalur fallback tersebut. Jika Web Crypto API tersedia dan selalu digunakan, jalur fallback mungkin tidak pernah dipakai.
- **Impact: 4 (Tinggi).** Nonce yang dapat diprediksi dapat mengurangi perlindungan kerahasiaan commitment. Dampak sebenarnya bergantung pada panjang nonce, cara pembuatannya, dan implementasi verifikasi.
- **Alasan prioritas:** Commitment harus menyulitkan pihak lain menebak nilai penawaran sebelum reveal.

### R03 Kebocoran Bukti Penawaran

**Komponen:** Browser, localStorage, dan file JSON bukti penawaran

**Kategori STRIDE:** Information Disclosure

- **Likelihood: 3 (Sedang).** Bukti yang disimpan di perangkat atau diekspor sebagai file dapat diakses pihak lain yang memperoleh akses ke perangkat atau file tersebut.
- **Impact: 5 (Sangat tinggi).** Jika nilai penawaran dan nonce diketahui sebelum reveal, kerahasiaan penawaran dapat terganggu.
- **Alasan prioritas:** Kerahasiaan nilai penawaran merupakan tujuan utama mekanisme sealed bid.

### R04 Akses Database Tanpa Izin

**Komponen:** SQLite dan penyimpanan cadangan

**Kategori STRIDE:** Information Disclosure dan Tampering

- **Likelihood: 2 (Rendah, sementara).** Risiko bergantung pada lokasi database, izin sistem operasi, konfigurasi server, dan cara cadangan dikelola.
- **Impact: 5 (Sangat tinggi).** Akses tanpa izin dapat mengungkap data yang tidak terenkripsi atau memungkinkan perubahan data jika akses tulis juga diperoleh.
- **Alasan prioritas:** Database menyimpan informasi penting terkait akun, lelang, dan penawaran.

### R05 Kredensial Akun Demo pada Produksi

**Komponen:** Proses seed akun dan autentikasi

**Kategori STRIDE:** Spoofing dan Elevation of Privilege

- **Likelihood: 2 (Rendah, sementara).** Risiko bergantung pada apakah akun demo masih dibuat, aktif, dan dapat digunakan pada deployment produksi.
- **Impact: 5 (Sangat tinggi).** Jika kredensial demo yang diketahui publik masih berfungsi, pihak lain berpotensi masuk sebagai akun tersebut dan menyalahgunakan hak akses yang dimilikinya.
- **Alasan prioritas:** Akun demo harus dipisahkan dari akun produksi, khususnya jika memiliki hak administrator.

## 5. Urutan Penanganan

Urutan berikut digunakan sebagai rencana awal berdasarkan skor dan potensi dampak:

1. **R01 â€” Secret bawaan:** pastikan secret wajib dikonfigurasi dengan aman.
2. **R03 â€” Bukti penawaran:** tinjau penyimpanan bukti dan perlindungan sebelum reveal.
3. **R04 â€” Database:** periksa izin akses file, lokasi, dan cadangan.
4. **R05 â€” Akun demo:** pastikan akun demo tidak dapat digunakan pada produksi.
5. **R02 â€” Nonce:** hilangkan penggunaan sumber acak nonkriptografis.

Urutan ini dapat berubah setelah pengujian menunjukkan kemungkinan dan dampak yang berbeda dari perkiraan awal.

## 6. Kesimpulan

Lima risiko prioritas berkaitan dengan pengelolaan secret, pembuatan nonce, kerahasiaan bukti penawaran, akses database, dan kredensial akun demo. Risiko tersebut dipilih karena dapat memengaruhi kerahasiaan data, autentikasi, dan keadilan proses lelang.

Setiap risiko perlu diverifikasi dengan pengujian yang sesuai. Setelah itu, nilai likelihood dan impact dapat diperbarui dan digunakan sebagai dasar pemilihan kontrol keamanan pada `security_controls.md`.
