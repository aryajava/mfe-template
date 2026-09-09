# Catatan DeepSeek V4 Flash — Template MFE

> Fondasi belajar **mandiri** untuk template `mfe-template` (Micro-Frontend berbasis Webpack 5 Module Federation, React 18, pnpm monorepo).
> **Tidak perlu membaca catatan model lain** — semua materi esensial dari review `learn/perbandingan-5-model.md` sudah digabung di sini: risiko/audit (gpt56luna), mental model (gemini38flash), pola & tooling (sonnet46thinking), insight (qwen38max), plus fakta & akurasi dari deepsekv4flash.

---

## 📚 Jalur Belajar (Urutan Baca yang Disarankan)

Ikuti fase di bawah ini **berurutan**. Setiap fase memberi hasil belajar (learning outcome) yang menjadi prasyarat fase berikutnya.

| Fase | Baca (urutan) | Hasil Belajar |
|------|---------------|---------------|
| **1. Pondasi Konsep** | [`01-konsep-dan-mental-model.md`](./01-konsep-dan-mental-model.md) | Paham konsep MFE, 3 package, mental model browser vs backend, dan alasan di balik pilihan arsitektur. |
| **2. Peta Proyek** | [`02-struktur-dan-scripts.md`](./02-struktur-dan-scripts.md) | Kenal isi repo, script pnpm, konvensi port, dan perbedaan konfigurasi tiap package. |
| **3. Mekanisme Inti** | [`03-module-federation-webpack.md`](./03-module-federation-webpack.md) | Paham `remoteEntry.js`, share scope, singleton React, `eager`, dan pola async bootstrap. |
| **4. Membangun Aplikasi** | [`04-shell-host.md`](./04-shell-host.md) → [`05-child-mfe-remote.md`](./05-child-mfe-remote.md) → [`06-shared-library.md`](./06-shared-library.md) | Paham tiap package: provider stack shell, LazyMFE, dual-mode child, dan kode bersama. |
| **5. Komunikasi & Konfigurasi** | [`07-auth-routing-eventbus.md`](./07-auth-routing-eventbus.md) → [`08-environment-config-runtime.md`](./08-environment-config-runtime.md) | Paham auth, routing SPA, event bus lintas MFE, dan konfigurasi runtime `window._env`. |
| **6. Praktik & Operasi** | [`09-pola-dan-insight.md`](./09-pola-dan-insight.md) → [`10-troubleshooting-dan-pitfall.md`](./10-troubleshooting-dan-pitfall.md) → [`15-tutorial-menambah-mfe-baru.md`](./15-tutorial-menambah-mfe-baru.md) → [`11-migrasi-monolith-ke-mfe.md`](./11-migrasi-monolith-ke-mfe.md) → [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md) | Menguasai pola penting, insight kritis, cara debug konkret, **latihan end-to-end menambah MFE baru**, panduan migrasi, dan daftar gap RISIKO sebelum produksi. |
| **7. Pengayaan & Uji Diri** | [`13-agent-tooling-repo.md`](./13-agent-tooling-repo.md) → [`14-ujian-dan-cheatsheet.md`](./14-ujian-dan-cheatsheet.md) | Kenal tooling agent repo (`.agents/skills`, issue tracker) dan menguji pemahaman lewat pertanyaan jebakan. |

### Jalur cepat (jika ingin ringkas)

| Situasi | Baca |
|---------|------|
| Hanya boleh baca 1 file | `catatan_deepsekv4flash.md` ini (induk + ringkasan + peta) |
| Referensi cepat harian | [`14-ujian-dan-cheatsheet.md`](./14-ujian-dan-cheatsheet.md) + [`02-struktur-dan-scripts.md`](./02-struktur-dan-scripts.md) |
| **Sebelum produksi** | [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md) — WAJIB |
| Menambah MFE baru | [`15-tutorial-menambah-mfe-baru.md`](./15-tutorial-menambah-mfe-baru.md) (langkah penuh) + [`09-pola-dan-insight.md`](./09-pola-dan-insight.md) §Checklist |
| Debug MFE blank | [`10-troubleshooting-dan-pitfall.md`](./10-troubleshooting-dan-pitfall.md) §Troubleshoot |
| **Belum kenal React/JS?** | [`prasyarat/00-index-prasyarat.md`](./prasyarat/00-index-prasyarat.md) — 7 file fondasi (ES6, TS, React, Hooks, Router) |
| **Uji pemahaman (100 soal)** | [`quiz/00-bank-soal-mfe.md`](./quiz/00-bank-soal-mfe.md) + [`quiz/01-kunci-jawaban-mfe.md`](./quiz/01-kunci-jawaban-mfe.md) |

---

## 🧭 Daftar Isi Lengkap

| # | Topik | File |
|---|-------|------|
| 01 | Konsep & Mental Model MFE | [`01-konsep-dan-mental-model.md`](./01-konsep-dan-mental-model.md) |
| 02 | Struktur Proyek & Scripts (pnpm) | [`02-struktur-dan-scripts.md`](./02-struktur-dan-scripts.md) |
| 03 | Module Federation & Webpack Config | [`03-module-federation-webpack.md`](./03-module-federation-webpack.md) |
| 04 | Shell / Host App | [`04-shell-host.md`](./04-shell-host.md) |
| 05 | Child MFE / Remote | [`05-child-mfe-remote.md`](./05-child-mfe-remote.md) |
| 06 | Shared Library (`@template/shared`) | [`06-shared-library.md`](./06-shared-library.md) |
| 07 | Auth, Routing & Event Bus | [`07-auth-routing-eventbus.md`](./07-auth-routing-eventbus.md) |
| 08 | Environment / Konfigurasi Runtime | [`08-environment-config-runtime.md`](./08-environment-config-runtime.md) |
| 09 | Pola Penting & Insight | [`09-pola-dan-insight.md`](./09-pola-dan-insight.md) |
| 10 | Troubleshooting & Common Pitfalls | [`10-troubleshooting-dan-pitfall.md`](./10-troubleshooting-dan-pitfall.md) |
| 11 | Migrasi Monolith → MFE | [`11-migrasi-monolith-ke-mfe.md`](./11-migrasi-monolith-ke-mfe.md) |
| 12 | Risiko & Gap Sebelum Produksi | [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md) |
| 13 | Agent Tooling Repo | [`13-agent-tooling-repo.md`](./13-agent-tooling-repo.md) |
| 14 | Ujian Pemahaman & Cheat Sheet | [`14-ujian-dan-cheatsheet.md`](./14-ujian-dan-cheatsheet.md) |
| 15 | Tutorial Praktik: Menambah MFE Baru | [`15-tutorial-menambah-mfe-baru.md`](./15-tutorial-menambah-mfe-baru.md) |

---

## 🏗 Ringkasan Arsitektur (30 Detik)

```
┌─────────────────────────────────────────────────────────────┐
│  SHELL / HOST  (port 5000)  — @template/shell               │
│  Login, Dashboard, Layout(Sidebar+Topbar), LazyMFE loader,  │
│  AuthContext, Module Federation HOST (shared deps)          │
└───────────────┬─────────────────────────────────────────────┘
                │  load remoteEntry.js secara dinamis (LazyMFE)
                ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│  CHILD MFE  (port 5006)     │   │  @template/shared         │
│  @template/mfe-child        │   │  library bersama:         │
│  exposes ./Module           │   │  UI components, contexts, │
│  standalone + MFE mode      │   │  hooks, lib(api, env,     │
│                             │   │  eventBus, utils), types  │
└─────────────────────────────┘   └───────────────────────────┘
```

**Konsep kunci:**
- **Module Federation**: Shell men-download `remoteEntry.js` dari Child saat runtime, lalu memuat komponen `./Module` dari scope `childMFE` secara lazy — URL remote bisa diganti tanpa rebuild shell.
- **Dependensi bersama (singleton)**: `react`, `react-dom`, `react/jsx-runtime`, `react-router-dom`, `@tanstack/react-query` di-share agar tidak ada duplikasi React (mencegah "Invalid hook call").
- **Dual mode Child MFE**: berjalan mandiri via `App.tsx`/`bootstrap.tsx`, atau dirender shell via `Module.tsx`.
- **Alias dev tanpa build**: webpack alias `@template/shared` → `../template-shared/src`, jadi tidak perlu build shared saat development.

---

## ⚠️ Aturan Emas (Ringkasan)

1. **Singleton React wajib** di semua webpack MF config; `eager: true` hanya di shell.
2. **LazyMFE** memuat remote dinamis (`scope`, `module`, `url`, `version`) + cache per version; cache-busting `?_t=` (dev) / `?v=` (prod).
3. **Auth TIDAK otomatis mengalir** ke child — `Module.tsx` child membuat `SharedProvider` tanpa props. Kontrak ini harus dibuat eksplisit → baca [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md).
4. **Port convention**: 5000 shell; 5006+ child MFE.
5. **Route shell** untuk MFE pakai `path="/child/*"` agar sub-route diteruskan; child memakai path-matching relatif terhadap `basePath`.
6. **Storage** memakai `sastStorage` (wrapper `localStorage`); token & sesi di `localStorage`.
7. **Runtime env** via `window._env` (dibekukan), bukan env build-time — seperti 12-Factor / ConfigMap.
8. **Demo fallback login wajib dihapus** sebelum produksi.
9. **`pnpm typecheck`** itu nyata; `transpileOnly` di webpack BUKAN pengganti type check.
10. **Shared build** butuh `node scripts/fix-imports.cjs` (tambal ekstensi `.js` di dist ESM).

---

## 📁 Peta File Lengkap Template

```
mfe-template/
├── package.json              # Workspace root, script agregat
├── pnpm-workspace.yaml       # Daftar package
├── pnpm-lock.yaml
├── start.ps1 / start.sh      # Quick start Windows / Linux-Mac
├── GETTING-STARTED.md        # Panduan mulai
├── MIGRATION-GUIDE.md        # Panduan migrasi monolith → MFE
├── AGENTS.md                 # Panduan agent (issue tracker, triage, domain docs)
├── docs/agents/              # issue-tracker.md, triage-labels.md, domain.md
├── .agents/skills/           # ~37 skill (implement, tdd, grilling, dsb.)
│
├── template-shared/          # @template/shared (ESM, build tsc)
│   ├── scripts/fix-imports.cjs   # Perbaiki ekstensi .js di dist
│   └── src/
│       ├── index.ts               # Re-export semua
│       ├── components/  ui/(button,card,input,label,tooltip,dropdown-menu,sonner)
│       │                common/(LoadingSpinner+PageLoader, GlobalLoadingOverlay,
│       │                        ErrorFallback+MFEErrorFallback)
│       ├── contexts/    SharedContext, LoadingContext
│       ├── hooks/       useAuth, useEventBus(+useEventSubscription)
│       ├── lib/         utils, eventBus(+MFE_EVENTS), api(createApiClient), env
│       ├── types/       PaginatedResponse, ApiResponse, dsb
│       └── styles/globals.css   # Tema HSL (light/dark)
│
├── template-shell/          # @template/shell — Host (port 5000)
│   ├── webpack.config.cjs   # ModuleFederationPlugin HOST
│   ├── env.js               # Template konfigurasi runtime (window._env) — TIDAK ter-serve
│   ├── public/env.js        # Stub yang BENAR-BENAR dimuat index.html (isi per environment)
│   └── src/
│       ├── index.tsx → bootstrap.tsx   # Provider chain + initSharedDependencies
│       ├── App.tsx → routes/routes.tsx
│       ├── routes/          routes.tsx, ProtectedRoute.tsx
│       ├── components/      LazyMFE, MFENotAvailable, Layout/, ErrorBoundary/
│       ├── contexts/        AuthContext.tsx
│       ├── pages/           Login, Dashboard, NotFound
│       ├── types/           remotes.d.ts
│       └── utils/           sharedDependencies.ts, sastStorage.ts
│
└── template-mfe-child/      # @template/mfe-child — Remote (port 5006)
    ├── webpack.config.cjs   # ModuleFederationPlugin REMOTE (exposes ./Module)
    └── src/
        ├── index.tsx → bootstrap.tsx   # Standalone mode
        ├── App.tsx         # Route standalone
        ├── Module.tsx      # Entry point saat dimuat shell
        ├── pages/          Home, NotFound
        ├── services/       api.ts (contoh API client)
        └── utils/          sastStorage.ts
```

---

## 🧩 Rekam Jejak Gabungan (Asal Materi)

Agar transparan: catatan ini menggabungkan keunggulan 5 model sesuai rekomendasi `learn/perbandingan-5-model.md`.

| Konten | Sumber asli | Divariasikan ke |
|--------|-------------|-----------------|
| Fakta codebase & akurasi tinggi (backbone) | deepsekv4flash | semua file |
| Risiko/gap nyata (8 bug), kontrak operasional remote, diagnosis | gpt56luna | [`12`](./12-risiko-dan-gap-produksi.md), [`10`](./10-troubleshooting-dan-pitfall.md) |
| Mental model backend↔browser, "kenapa singleton", circuit breaker, SPA vs Nginx, 12-Factor env | gemini38flash | [`01`](./01-konsep-dan-mental-model.md), [`03`](./03-module-federation-webpack.md), [`07`](./07-auth-routing-eventbus.md), [`08`](./08-environment-config-runtime.md), [`14`](./14-ujian-dan-cheatsheet.md) |
| Pedagogi (kenapa async bootstrap, eager), pola 1–5, troubleshooting curl, agent tooling | sonnet46thinking | [`03`](./03-module-federation-webpack.md), [`09`](./09-pola-dan-insight.md), [`10`](./10-troubleshooting-dan-pitfall.md), [`13`](./13-agent-tooling-repo.md) |
| 10 insight kritis (disaring) | qwen38max | [`09`](./09-pola-dan-insight.md) |

> **Catatan kejujuran:** klaim keliru dari model lain TIDAK disalin (mis. `window.__ENV__` tidak ada, `SharedContext` bukan `{user, token}`, auth "mengalir otomatis" adalah salah). Semua fakta di sini sudah diverifikasi terhadap source code template.

---

## Tech Stack

- **React 18.3.x** + TypeScript 5.9, React Router 6.30
- **TanStack React Query 5** (query client + devtools di shell)
- **Webpack 5** + Module Federation + `ts-loader` + dev-server
- **Tailwind CSS 3.4** + `tailwindcss-animate` (shadcn-style, Radix UI primitives)
- **pnpm workspace** + `concurrently`
- UI: lucide-react icons, sonner (toast), Radix (dropdown, label, slot, tooltip)