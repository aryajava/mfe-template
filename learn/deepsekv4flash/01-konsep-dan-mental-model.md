# 01 — Konsep & Mental Model MFE

> Fase 1 dari Jalur Belajar. Sebelum membaca kode, bangun dulu kerangka pikir yang benar.

## Apa Itu Template Ini

Template **Micro-Frontend (MFE)** berbasis **Webpack 5 Module Federation** untuk React. Terdiri dari 3 package dalam satu pnpm workspace:

| Package | Nama npm | Peran | Port |
|---------|----------|-------|------|
| `template-shell` | `@template/shell` | Host/shell — login, layout, routing, loader MFE | 5000 |
| `template-mfe-child` | `@template/mfe-child` | Remote MFE contoh (exposes `./Module`) | 5006 |
| `template-shared` | `@template/shared` | Library kode bersama | — |

## Mental Model Kritis: Browser ≠ Docker

Banyak programmer (terutama backend) salah mengira MFE terisolasi seperti microservices. **Bukan begitu.** Ini konsep paling penting untuk dipahami:

| Aspek | Microservices (Backend) | Micro-Frontend (Browser) |
|-------|-------------------------|--------------------------|
| Proses | Multi-proses/kontainer (Docker), PID & RAM terpisah | **Single thread V8 + satu memori heap per tab** |
| Isolasi | Terisolasi total di level OS | **TIDAK ada isolasi otomatis** — semua berbagi `window` & `document` |
| Komunikasi | TCP/IP, HTTP, gRPC, Kafka/RabbitMQ | Memori lokal (EventBus, callback), query string |
| Routing | Reverse proxy (Nginx, Kong) | **HTML5 History API** (`pushState`) di memori browser |
| Penanganan kegagalan | Circuit breaker (Hystrix), auto-failover | **React Error Boundary** → cegah White Screen of Death |

**Implikasinya:** semua kode dari shell (port 5000) dan child (port 5006) dieksekusi di **thread V8 yang sama**. Inilah kenapa React wajib **singleton** — dua salinan React di satu heap global akan bertabrakan (error "Invalid hook call"). Lihat detail di [`03-module-federation-webpack.md`](./03-module-federation-webpack.md).

## Tiga Lapisan

### Shell (Host)
- Halaman Login, Dashboard, Layout sidebar, autentikasi.
- Memuat child MFE **dinamis** (lazy) via `LazyMFE`.
- Mengelola dependensi bersama (shared singleton, `eager: true`).

### Child MFE (Remote)
- Mengekspos komponen `Module` lewat Module Federation.
- **Dual mode**: bisa standalone (`App.tsx` + `bootstrap.tsx`, port 5006 sendiri) ataupun dimuat shell (`Module.tsx`).
- Berbagi React/React Router dengan shell (singleton).

### Shared Library (`@template/shared`)
- UI components, common components, contexts, hooks, utils, api client, types, env.
- Dev: webpack alias langsung ke source (`../template-shared/src`) → tanpa build step.
- Produksi: di-compile `tsc` → ESM di `dist/` + `fix-imports.cjs`.

## Alur Request Runtime

```
Browser → Shell :5000
  ├─ login → AuthContext (fetch /Auth/login, simpan token di localStorage)
  ├─ route /child/* → LazyMFE
  │     ├─ muat remoteEntry.js childMFE dari :5006
  │     ├─ init share scope (React dsb singleton)
  │     ├─ container.get('./Module')
  │     └─ render <Module basePath="/child" />
  └─ Child memakai @template/shared (context, api, eventBus)
```

## Kenapa Memilih Pilihan Arsitektur Ini (Pertanyaan "Why")

### Kenapa Webpack Module Federation, bukan Single-SPA / Qiankun?
- Built-in Webpack 5 — tanpa library tambahan.
- Mature & production-proven.
- Tanpa lock-in ke framework MFE spesifik; kontrol penuh atas konfigurasi.

### Kenapa pnpm workspaces?
- **Efisien disk**: dependency di-hoist, tidak duplikat per package.
- **Native workspace support**: `pnpm --filter` powerful untuk script lintas package.
- Install lebih cepat dari npm/yarn.

### Kenapa Tailwind, bukan CSS-in-JS atau CSS biasa?
- **Tanpa runtime overhead** — CSS di-generate saat build.
- **Purging otomatis** — hanya class terpakai yang masuk bundle.
- **Class unik atomik** (`px-4 bg-blue-600`) → tidak ada class global yang bisa bertabrakan antar MFE (menghindari CSS bleeding). Detail di [`10`](./10-troubleshooting-dan-pitfall.md).

### Kenapa dynamic loading (LazyMFE), bukan `remotes:` statis?
- URL remote bisa diganti di `env.js` **tanpa rebuild shell**.
- Mendukung canary deploy, A/B testing, multi-environment.
- MFE tidak dimuat jika route tidak diakses (bundle kecil).

## Keunggulan Arsitektur Ini
- **Deploy terpisah** per MFE (tim berbeda, rilis berbeda).
- **Isolasi kegagalan**: satu MFE down tidak merusak shell (error boundary).
- **Bundle lebih kecil** per aplikasi, dimuat sesuai kebutuhan (lazy).
- **Skalabilitas tim**: setiap fitur menjadi package sendiri.

---
Lanjut ke [**02. Struktur Proyek & Scripts (pnpm)**](./02-struktur-dan-scripts.md)