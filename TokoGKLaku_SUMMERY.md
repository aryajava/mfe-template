# Ringkasan Proyek — Toko Online "Toko GKLaku" (BNI Trial)

> Dokumen ini adalah ringkasan konseptual agar proyek ini bisa dipahami oleh manusia maupun agent AI lain, tanpa merujuk ke kode sumbernya. Bila proyek ini dijadikan contoh di tempat lain, dokumen ini bisa disalin dan dibaca langsung.

## Apa proyek ini

Aplikasi **toko online** utuh (satu aplikasi web monolit, ASP.NET Core .NET 10 + Razor Pages) bernama **"Toko GKLaku"**. Pelanggan berbelanja dari area toko publik; pengurus mengelola toko dari kantor yang terpisah sama sekali. Nilai utamanya bukan fitur, melainkan disiplin desain yang bisa ditiru: kosakata domain yang ketat, keputusan arsitektur yang direkam (ADR), jejak audit permanen berbasis basis data, pemisahan tegas dua kelas akun, dan alur bisnis "tanpa jalan pintas".

Bayangkan aplikasi ini sebagai dua situs dalam satu aplikasi:

- **Toko** (untuk semua orang) dengan nuansa biru terang, santai, dan ramah.
- **Kantor staf** (tersembunyi) yang rapi, padat, dan hanya terlihat oleh pengurus.

---

## 1. Wajah toko (area publik)

Halaman pertama yang dilihat pengunjung adalah **katalog produk**: satu baris navigasi putih semi-transparan menempel di atas layar, berisi logo toko, kotak pencarian "Cari produk...", ikon keranjang dengan lencana jumlah, dan tombol **Masuk** (atau menu akun setelah masuk).

Di bawahnya, tata letak dua kolom:

- **Kolom kiri**: daftar kategori dengan jumlah produk tiap kategori; kategori yang sedang dipilih tampil dengan latar biru lembut.
- **Kolom utama**: grid kartu produk (2 sampai 4 kolom tergantung lebar layar). Setiap kartu menampilkan foto (rasio 4:3), lencana kuning `-15%` bila sedang diskon, lencana abu-abu **"Habis"** bila stok nol, judul dua baris, harga asli yang dicoret tipis, dan harga efektif yang tebal biru. Di dasar kartu ada dua tombol berdampingan: ikon keranjang (+) dan tombol **Beli**.

Di atas grid ada tombol-tombol kecil berbentuk pil (chip) untuk mengurutkan **Terbaru / Termurah / Termahal**, dan bila pengunjung sedang mencari atau memfilter, muncul chip filter yang bisa ditutup (misal `"sepatu" ×`). Pencarian tidak menemukan apa pun? Muncul kartu kosong dengan ikon besar dan ajakan "Lihat Semua Produk".

**Wireframe halaman katalog:**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [storefront] Toko GKLaku   [🔍 Cari produk...            ]  🛒 (3)  [Masuk] │
├──────────────────┬───────────────────────────────────────────────────┤
│ Kategori         │  Katalog Produk · 120 produk                      │
│                  │  [Terbaru] [Termurah] [Termahal]                  │
│ ● Semua  (120)   │  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│ ○ Elektronik(38) │  │  [foto 4:3] │ │  [foto 4:3] │ │  [foto 4:3] │     │
│ ○ Fashion (35)   │  │  -15%  Habis│ │  -10%      │ │            │     │
│ ○ Otomotif (21)  │  │ Sepatu Run..│ │ Jaket Denim│ │ T-Shirt Kot│     │
│ ○ Rumah   (26)   │  │ Rp250.000   │ │ Rp180.000  │ │ Rp95.000    │     │
│                  │  │ Rp212.500   │ │ Rp162.000  │ │ Rp95.000    │     │
│                  │  │ [+][Beli]   │ │ [+][Beli]  │ │ [+][Beli]   │     │
│                  │  └────────────┘ └────────────┘ └────────────┘     │
│                  │  Menampilkan 1–12 dari 120   ◀ 1 2 3 … 10 ▶       │
└──────────────────┴───────────────────────────────────────────────────┘
```

**Halaman detail produk** menampilkan foto besar di kiri, dan di kanan: judul, kategori, lencana diskon, harga coret lalu harga tebal besar, deskripsi, stok tersedia, dan tombol **Masukkan Keranjang**.

```text
┌──────────────────────────┬─────────────────────────────────────────────┐
│        [foto produk]     │  Sepatu Running Pro                          │
│        (kartu 320px)     │  Kategori: Fashion            [-15%]         │
│                          │  Rp250.000 (coret) · Rp212.500 (tebal biru)  │
│                          │  Deskripsi produk ......................     │
│                          │  Stok tersedia: 10                           │
│                          │  [🛒 Masukkan Keranjang]                     │
└──────────────────────────┴─────────────────────────────────────────────┘
```

## 2. Berbelanja sampai pesanan tiba (alur pelanggan)

1. **Keranjang.** Pengunjung yang belum masuk menyimpan keranjangnya di browser (lencana jumlah di navbar ikut bertambah). Begitu masuk akun, keranjang itu digabung otomatis ke akunnya dan ikut tersedia dari perangkat lain. Keranjang tidak mengurangi stok.
2. **Checkout wajib masuk.** Tombol checkout mengarahkan pelanggan untuk **Daftar** (nama, email, sandi) atau **Masuk** (email + sandi). Di layar checkout pelanggan mengisi alamat kirim, memilih **ekspedisi** (misal "Kurir Toko" atau "J&T", masing-masing dengan ongkir), lalu melihat ringkasan: subjumlah (pakai harga setelah diskon) + ongkir + pajak = **total**.
3. **Konfirmasi pesanan.** Sebelum pesanan terbentuk, pelanggan membuktikan identitasnya: mengulang kata sandi, dan bila pengurus mengaktifkannya, juga menyelesaikan CAPTCHA yang dijalankan aplikasi sendiri (tanpa layanan pihak ketiga). Pesanan baru tercipta bila keduanya lolos.
4. **Pesanan Saya.** Daftar riwayat pesanan dengan lencana status berwarna. Pelanggan bisa membatalkan (wajib mengisi alasan, selama masih boleh) dan menandai pesanan **Diterima** saat barang datang.

**Peta alur belanja:**

```text
Katalog ──► Detail Produk ──► Keranjang ──► (wajib Masuk/Daftar) ──► Checkout
   ▲                                        ▲                          │
   └── bisa tambah langsung dari kartu ─────┘                          ▼
Pesanan Saya ◄── Pesanan tercipta (stok dikurangi) ◄── Konfirmasi: kata sandi + CAPTCHA
     │                    ┌─ DIBATALKAN (alasan wajib; stok kembali)
     ▼                    ▼
MENUNGGU_KONFIRMASI → DIKEMAS → DIKIRIM → DITERIMA
```

**Wireframe layar checkout:**

```text
Checkout ─ silakan masuk akun dulu
┌──────────────────────────────────────┬───────────────────────────┐
│ Data Pengiriman                      │ Ringkasan                 │
│ Nama      [____________]             │ Subtotal    Rp 212.500    │
│ No. HP    [____________]             │ Ongkir      Rp  10.000    │
│ Alamat    [________________]         │ Pajak (2%)  Rp   4.250    │
│ Catatan   [____________]             │ ────────────────────      │
│                                      │ Total       Rp 226.750    │
│ Ekspedisi                            │                           │
│ (•) Kurir Toko      Rp 10.000        │                           │
│ ( ) J&T             Rp 15.000        │                           │
│                                      │                           │
│ Konfirmasi Identitas                 │ [🔒 Buat Pesanan]         │
│ Kata sandi [________]  [🛡 CAPTCHA]  │                           │
└──────────────────────────────────────┴───────────────────────────┘
```

Catatan penting: **harga dihitung ulang saat tombol konfirmasi ditekan** (subtotal memakai harga setelah diskon yang berlaku saat itu, plus ongkir dan pajak), dan stok berkurang hanya di titik itu.

## 3. Kantor staf (area `/Panel`, tersembunyi)

Area ini **tidak boleh diketahui pelanggan**; pengunjung yang belum masuk diarahkan ke halaman **Masuk staf** yang terpisah (akun pengurus berbeda kelas dari akun pelanggan). Tampilannya langsung terasa "kantor": **sidebar putih di kiri** dengan ikon, dikelompokkan **Beranda, Master, Operasional, Maintenance, Monitoring, Settings**, dan **topbar** berisi jejak halaman (breadcrumb), nama pengguna, lencana peran, dan tombol keluar. Menu menyesuaikan peran: menu yang tidak boleh diakses peran tertentu **tidak dimunculkan sama sekali**.

**Dashboard** membuka dengan deretan kartu statistik berwarna: **Total Produk** (biru), **Produk Diskon** (biru muda), **Stok Menipis 1–5** (kuning), **Stok Habis** (merah), lalu untuk pemilik: **Diskon Menunggu Persetujuan**, **Pesanan Menunggu Proses**, dan **Pesanan Hari Ini**. Tiap kartu bisa diklik dan langsung membawa ke halaman terkait.

**Wireframe tata letak panel (semua halaman berpola sama):**

```text
┌──────────────┬──────────────────────────────────────────────────────────┐
│  [storefront]│  Beranda > Master > Master Produk      Nama [Pemilik] ⏻ │
│  Toko GKLaku │──────────────────────────────────────────────────────────│
│              │                                                          │
│ BERANDA      │  Dashboard (klik kartu → ke halamannya)                  │
│  ▸ Dashboard │  ┌────────┐┌────────┐┌────────┐┌────────┐                │
│ MASTER       │  │🟦 Total││🟦 Diskon││🟨 Stok ││🟥 Stok │                │
│  ▸ Produk    │  │  Produk ││   42   ││ Menipis││ Habis │                │
│  ▸ User      │  │  120   ││        ││   8    ││   3   │                │
│  ▸ Kategori  │  └────────┘└────────┘└────────┘└────────┘                │
│  ▸ Ekspedisi │  ┌────────┐┌────────┐                                    │
│  ▸ Pelanggan │  │🟨 Diskon││🟦 Pesanan│                                   │
│ OPERASIONAL  │  │ Menunggu││ Hari Ini│                                    │
│  ▸ Pesanan   │  │   5    ││   12   │                                    │
│ MAINTENANCE  │  └────────┘└────────┘                                    │
│  ▸ UserCtrl  │                                                          │
│ MONITORING   │                                                          │
│  ▸ Permintaan│                                                          │
│  ▸ Notifikasi●                                                          │
│  ▸ Persetuj. │                                                          │
│  ▸ Laporan   │                                                          │
│ SETTINGS     │                                                          │
│  ▸ Pengaturan│                                                          │
│  ▸ Audit Log │                                                          │
│ ─────────────│                                                          │
│ [🛠 API Docs]│                                                          │
└──────────────┴──────────────────────────────────────────────────────────┘
```

Catatan: menu di sidebar **disesuaikan dengan peran** (mis. "Master User" dan "Persetujuan Diskon" hanya untuk Pemilik/Super Admin; "Audit Log" hanya Super Admin).

**Halaman data** (Master Produk, Master Kategori, Master User, Master Pelanggan, Master Ekspedisi, Pesanan, dan lain-lain) semuanya berpola sama: tabel dengan **judul kolom yang bisa diklik untuk mengurutkan**, kotak pencarian, filter, nomor baris, harga dalam format Rupiah, pagination ringkas, dan **tombol aksi berupa ikon** (edit biru, hapus merah, terbitkan abu-abu). Tindakan penting meminta konfirmasi lewat popup, lalu umpan balik muncul sebagai pemberitahuan kecil di sudut layar.

**Wireframe halaman data (contoh Master Produk):**

```text
Master Produk                                    [+ Tambah Produk]
[Cari produk...             ]  [Kategori ▾]  [Status ▾]
┌────┬─────────────┬──────────────────┬─────────┬────────┬─────┬────────┬──────┐
│ #  │ Produk      │ Harga Dasar      │ Diskon  │ Stok   │ Kat │ Status │ Aksi │
├────┼─────────────┼──────────────────┼─────────┼────────┼─────┼────────┼──────┤
│ 1  │ Sepatu Run..│ Rp250.000        │ -15%    │ 10     │ Fsn │ Aktif  │ ✎ 🗑 │
│ 2  │ Jaket Denim │ Rp180.000        │ -10%    │ 0      │ Fsn │ Aktif  │ ✎ 🗑 │
│ 3  │ T-Shirt K.. │ Rp95.000         │ -       │ 25     │ Fsn │ Nonaktif│ ✎ 🗑 │
└────┴─────────────┴──────────────────┴─────────┴────────┴─────┴────────┴──────┘
                                     ◀ 1 2 3 … 10 ▶
```

**Alur status pesanan yang dikerjakan staf:**

```text
MENUNGGU_KONFIRMASI ──[Konfirmasi & Kemas]──► DIKEMAS ──[Tandai Dikirim]──► DIKIRIM ──(pelanggan: Diterima)──► DITERIMA
        │                                    │
        └──[Batalkan + alasan]──► DIBATALKAN ◄──[Batalkan + alasan]
             (pembeli atau penjual)              (penjual saja)
             → stok dikembalikan
```

**Matriks ringkas peran** (menu yang tampil mengikuti tabel ini):

| Fitur / halaman | Admin Toko | Pemilik Toko | Super Admin |
|---|---|---|---|
| Kelola produk & kategori | ✔ (hapus ✘) | ✔ | ✔ |
| Master User, User Control, Ekspedisi | ✘ | ✔ | ✔ |
| Master Pelanggan | ✘ | ✔ | ✔ |
| Permintaan Diskon | milik sendiri | semua | semua |
| Persetujuan Diskon | ✘ | ✔ | ✔ |
| Laporan Penjualan | ✘ | ✔ | ✔ |
| Pengaturan Aplikasi (ambang login) | ✘ | ✘ | ✔ |
| Pengaturan Toko (ongkir, pajak) | ✘ | ✔ | ✔ |
| Audit Log | ✘ | ✘ | ✔ |

**Pesanan** menampilkan daftar ber-lencana status. Pengurus menggerakkan pesanan maju dengan tombol **Konfirmasi & Kemas** lalu **Tandai Dikirim**; pembatalan selalu meminta alasan. **Laporan Penjualan** memperlihatkan produk **terlaris** dan **jarang terjual** dengan filter 7/30 hari/sepanjang masa. **Notifikasi** menampilkan lencana merah di sidebar dan melayang toast bila ada peristiwa baru (misal pesanan baru), diperbarui otomatis tiap beberapa detik.

**Alur diskon** punya dua halaman terpisah: **Permintaan Diskon** (daftar permintaan yang menunggu; staf hanya melihat miliknya) dan **Persetujuan Diskon** (khusus pemilik/super admin, untuk menyetujui atau menolak). Tidak ada jalan pintas: perubahan diskon oleh siapa pun selalu jadi permintaan yang menunggu keputusan, dan produk memakai diskon lama sampai diputuskan.

**Settings** berisi: **Pengaturan Aplikasi** (ambang penguncian setelah gagal masuk, khusus super admin), **Pengaturan Toko** (ongkir tetap dan persen pajak, untuk pemilik), dan **Audit Log** dengan tiga tab: aksi pengurus, siklus hidup akun pelanggan, dan lalu lintas HTTP. Dari sidebar juga ada tautan **Dokumentasi API** (Swagger).

## 4. Profil teknis

| Aspek | Pilihan |
|---|---|
| Kerangka | ASP.NET Core (.NET 10), Razor Pages + API controller dalam satu proyek web |
| Basis data | SQL Server, akses data via Dapper, migrasi via dbup (skrip SQL berurutan) |
| Keamanan | Autentikasi cookie dua kelas akun; API dilindungi kunci; sandi di-hash (bcrypt) |
| Logging | Pemisahan tegas: jejak audit di tabel basis data, kesalahan teknis di file log |
| Antarmuka | Bahasa Indonesia di UI; nama tabel basis data dalam bahasa Inggris |

## 5. Prinsip jejak (khas proyek ini)

Hampir semua keputusan bisnis ditulis permanen ke tabel audit di basis data, bukan file: aksi pengurus yang mengubah data (dengan nilai sebelum dan sesudah), siklus hidup akun pelanggan (daftar, masuk, gagal masuk, ubah profil, ganti sandi, blokir/buka), dan lalu lintas HTTP area pengurus. Data rahasia disunting sebelum disimpan, dan tabel audit sengaja tidak memakai relasi kunci asing agar tetap utuh sebagai bukti sekalipun data terkait dihapus. Kesalahan teknis dicatat terpisah dan tidak tercampur dengan jejak audit.

## 6. Arsitektur API

Satu set endpoint REST di bawah `/api/*` dengan pola seragam: setiap daftar data punya endpoint berhalaman (nomor halaman, ukuran, pengurutan dengan daftar kolom yang diizinkan, pencarian) plus filter khusus tiap entitas. Endpoint juga melayani kebutuhan UI grid dan integrasi: sinkronisasi katalog dari API eksternal contoh, keputusan persetujuan diskon, blokir/buka pelanggan dan pengurus, transisi status pesanan, laporan, dan penelusuran audit. Keamanan memakai kunci API dengan fallback kunci uji, dan kunci rahasia per pengguna untuk akses grid.

## 7. Asal-usul dan evolusi

Proyek dimulai sebagai percobaan endpoint CRUD dengan konsumen data dari API produk publik (fakestoreapi), lalu dirombak total menjadi toko online dengan dua area, dua kelas akun, siklus pesanan penuh, audit dua sisi, dan laporan penjualan. Sejarah ini terekam dalam dokumen rencana eksekusi dan ADR bernomor, bukti bahwa arsitekturnya tumbuh lewat keputusan yang direkam, bukan sekadar ditumpuk fitur.

## 8. Dokumen pendukung di repo ini

Kosakata domain resmi (istilah yang dipakai + istilah yang dilarang) ada di glossary proyek; keputusan desain bermakna direkam sebagai ADR; kebutuhan produk dirinci di dokumen PRD. Ketika mengerjakan atau meniru proyek ini, baca ketiganya lebih dulu agar bahasa dan arah desainnya konsisten.
