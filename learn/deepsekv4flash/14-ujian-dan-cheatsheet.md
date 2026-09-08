# 14 — Ujian Pemahaman & Cheat Sheet

> Fase 7 dari Jalur Belajar. Uji diri setelah membaca `01`–`13`. Jawab dulu, baru lihat jawaban di bawah.

## Glosarium Istilah Kunci

| Istilah | Arti |
|---------|------|
| **Host (Shell)** | Aplikasi penampung utama yang pertama dimuat browser (port 5000) |
| **Remote (Child)** | Aplikasi mandiri yang mengekspos modul untuk dikonsumsi host di runtime |
| **Module Federation** | Plugin Webpack 5 untuk berbagi kode JS dinamis di browser |
| **`remoteEntry.js`** | File manifest kecil dari remote, berisi `init()` & `get()` — BUKAN seluruh bundle |
| **Share Scope** | Ruang tukar dependensi bersama (mis. React) yang dikelola Webpack di `window` |
| **Singleton** | Jaminan hanya 1 salinan library di memori browser |
| **Eager** | Library diunduh sinkron saat inisialisasi app (wajib `true` di shell, `false` di child) |
| **HTML5 History API (`pushState`)** | Manipulasi URL bar di memori tanpa HTTP reload |
| **EventBus** | Pub/sub decoupled antar MFE di memori browser (≈ Kafka mini) |
| **Error Boundary** | Penangkap crash (Circuit Breaker) agar error 1 MFE tidak blank-kan seluruh web |
| **LazyMFE** | Komponen shell yang memuat remote dinamis saat runtime |
| **`window._env`** | Konfigurasi runtime yang dibekukan (`Object.freeze`) |
| **`sastStorage`** | Wrapper localStorage dengan nama diobfuskasi (bukan enkripsi) |
| **`MFE_EVENTS`** | Katalog event lintas MFE (event bus) |
| **Async Bootstrap** | `import('./bootstrap')` — memberi waktu MF negotiate shared modules |
| **`fix-imports.cjs`** | Script menambal ekstensi `.js` pada import relatif di `dist` (ESM) |

## 5 Pertanyaan Jebakan Klasik

Jawab SALAH/BENAR + alasan, sebelum melihat jawaban.

1. **"Browser mengisolasi MFE seperti Docker container / proses OS terpisah."**
2. **"Kita butuh server Nginx di dalam browser untuk me-redirect rute port 5006 ke port 5000."**
3. **"Agar tidak ada CSS conflict, matikan saja CSS di Child MFE."**
4. **"Child MFE A bisa meng-import store state Redux milik Child MFE B langsung dari kodenya."**
5. **"File `remoteEntry.js` berisi seluruh bundle kode Child MFE beserta React."**

## 5 Pertanyaan Level Lanjut (untuk yang sudah baca 09/12)

6. **"Karena shell dan child sama-sama membungkus `SharedProvider`, auth user shell otomatis terbaca di child."**
7. **"Semua config environment disuntik saat build, jadi ganti environment harus rebuild."**
8. **"Token di `sastStorage` aman karena namanya diobfuskasi."**
9. **"`eager: true` harus diset di semua MFE agar cepat."**
10. **"`pnpm build` sudah cukup menjamin kode aman type-check sebelum deploy."**

---

## Jawaban Jebakan

1. **SALAH.** Browser = 1 thread V8 + 1 heap per tab; semua berbagi `window`/`document`. Isolasinya disiplin (singleton, scope), bukan OS.
2. **SALAH.** Tidak ada Nginx di browser. Navigasi dikelola JS di memori (React Router + `pushState`). Nginx hanya dibutuhkan **di server** untuk rewrite SPA saat F5.
3. **SALAH.** Itu mematikan otonomi tim. Solusinya Tailwind (utility class) atau CSS Modules (hash unik).
4. **SALAH.** Itu tight coupling. Gunakan Event Bus (`eventBus` + `MFE_EVENTS`) di `@template/shared`.
5. **SALAH.** `remoteEntry.js` hanyalah manifest kecil berisi `init()`/`get()`. Kode sesungguhnya di-download on-demand saat `container.get('./Module')`.
6. **SALAH.** `SharedProvider` child dibuat tanpa props → `defaultAuthContext` kosong. Harus kontrak eksplisit (inject `authContext`). Lihat [`12`](./12-risiko-dan-gap-produksi.md).
7. **SALAH.** Template memakai runtime injection `window._env` dari `env.js` (12-Factor). Ganti environment = ganti file, tanpa rebuild.
8. **SALAH.** Obfuscation ≠ enkripsi. Data tetap plain `localStorage`, rentan XSS.
9. **SALAH.** `eager: true` hanya di shell (bootstrap sinkron). Remote `eager: false` agar memakai shared host.
10. **SALAH.** `transpileOnly: true` di shell webpack skip type check. Jalankan `pnpm typecheck`.

## Cheat Sheet Perintah Harian

```bash
pnpm install        # install semua
pnpm dev            # shell (5000) + child (5006) paralel
pnpm dev:shell      # shell saja
pnpm dev:child      # child saja (standalone)
pnpm build          # build shared → shell → child
pnpm build:shared   # tsc + fix-imports
pnpm typecheck      # tsc --noEmit semua package
pnpm clean          # hapus dist/node_modules/.webpack-cache
```

**Debug remote:** `curl http://localhost:5006/remoteEntry.js` · cek CORS · scope=name · module=exposes key · share scope berisi react/react-dom.

## Ringkasan Nilai (Core Takeaways)

1. Satu tab = satu runtime — **singleton** adalah hukum.
2. **Shell = pemilik auth & router; child = konten**; sambungan auth harus eksplisit.
3. **LazyMFE + `env.js`** = deploy MFE tanpa rebuild shell.
4. **Error boundary per MFE** = blast radius kecil.
5. **Sebelum produksi, baca `12-risiko-dan-gap-produksi.md`** — demo login, CORS, token, `/unauthorized`, dan kontrak auth adalah 5 hal wajib dibereskan.

---
← Kembali ke [**Induk: catatan_deepsekv4flash.md**](./catatan_deepsekv4flash.md)