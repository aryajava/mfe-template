# 10 — Referensi Cepat (Port, Pitfall, Checklist)

## Konvensi Port

| Port | Proyek |
|------|--------|
| 5000 | Shell |
| 5001 | (reserved) |
| 5002–5005 | (reserved untuk services) |
| 5006 | Child MFE 1 (admin) |
| 5007 | Child MFE 2 (reports) |
| 5008 | Child MFE 3 (workflow) |
| 5009 | Child MFE 4 |
| 5010 | Child MFE 5 |

## Port Microservice (fallback di `env.ts`)

| Service | Port |
|---------|------|
| auth | 5139 |
| workflow | 5224 |
| rules | 5227 |
| dedup | 5084 |
| portfolio | 5091 |
| screening | 5291 |
| partnership / common | 5062 |

## Common Pitfalls & Solusinya

### 1. Duplikasi React
- **Gejala**: error hooks, banyak kopi React.
- **Fix**: `singleton: true` di shared config semua MFE, dan `eager: true` di shell.

### 2. CSS konflik antar MFE
- **Gejala**: style MFE bocor ke MFE lain.
- **Fix**: CSS modules, class names scoped, atau Tailwind (class unik). Pastikan Tailwind `content` menyertakan `template-shared/src` agar kelas shared ter-compile.

### 3. MFE gagal load
- **Gejala**: halaman blank / spinner selamanya.
- **Fix**:
  - Cek URL remote benar & dev server remote jalan.
  - Cek console browser untuk error CORS.
  - Verifikasi `scope` dan `module` cocok dengan config remote.

### 4. State shared tidak sinkron
- **Gejala**: auth tidak mengalir ke child.
- **Fix**: pakai pola `SharedProvider` — shell meneruskan `authContext`, child membungkus kontennya dengan `SharedProvider`.

### 5. Routing conflict
- **Gejala**: route child tidak match / 404.
- **Fix**:
  - Shell pakai `path="/child/*"` (dengan `/*` untuk passthrough).
  - Child pakai route relatif terhadap base-nya (bukan `/child/users`, cukup `users`), atau lakukan path-matching via `useLocation()` di `Module.tsx`.
  - Cocokkan `basePath` prop dengan route shell.

### 6. RemoteEntry tidak termuat saat produksi
- **Fix**: pastikan `publicPath: 'auto'` di remote; URL `remoteEntry.js` bisa diakses publik (CORS diizinkan).

## Checklist Cepat Sebelum Commit MFE Baru

- [ ] Scope `name` unik; port tidak bentrok.
- [ ] `exposes` menunjuk ke `Module.tsx`.
- [ ] Shared config `singleton: true` (+ `eager: true` di shell).
- [ ] Child bisa standalone **dan** dimuat shell.
- [ ] Terdaftar di `routes.tsx`, `env.js` MFE_ROUTES, Layout, `pnpm-workspace.yaml`.
- [ ] `tsc --noEmit` (typecheck) lolos semua package.
- [ ] Build shared OK (jalankan `node scripts/fix-imports.cjs`).

## Script yang Sering Dipakai

```bash
pnpm install        # install semua
pnpm dev            # shell + child (concurrently)
pnpm dev:shell      # shell saja :5000
pnpm dev:child      # child saja :5006
pnpm build          # shared + shell + child (produksi)
pnpm build:shared   # build shared
pnpm typecheck      # typecheck semua
pnpm clean          # hapus dist / node_modules / .webpack-cache
```

## Istilah Kunci

| Istilah | Arti |
|---------|------|
| Host / Shell | Aplikasi utama yang memuat MFE lain (port 5000) |
| Remote | MFE yang mengekspos modul (port 5006) |
| `remoteEntry.js` | File entry Module Federation dari remote |
| Scope | Nama unik container MF (mis. `childMFE`) |
| `exposes` | Modul yang dipublikasikan remote (`./Module`) |
| Singleton | Dependensi hanya satu instance (React dsb.) |
| Eager | Dependensi dimuat sinkron di bundle (shell) |
| LazyMFE | Komponen shell untuk memuat remote dinamis |
| `@template/shared` | Library kode bersama antar MFE |
| `window._env` | Konfigurasi runtime yang dibekukan |
| `sastStorage` | Wrapper localStorage (nama diobfuskasi) |
| `MFE_EVENTS` | Katalog event lintas MFE (event bus) |
