# 15 — Tutorial Praktik: Menambah Child MFE Baru

> Fase 6 dari Jalur Belajar. Latihan end-to-end: bikin MFE **Admin** (`adminMFE`, port **5007**, route `/admin`) dari `template-mfe-child`.
> Prasyarat: sudah paham `03` (config), `04` (shell), `05` (child). Debug? → [`10`](./10-troubleshooting-dan-pitfall.md).

## Langkah 0 — Siapkan Lingkungan

```bash
pnpm install
pnpm dev        # shell :5000 + child :5006 berjalan dulu sebagai baseline
```

## Langkah 1 — Salin Template Child

```bash
# Linux / macOS / Git Bash
cp -r template-mfe-child template-mfe-admin
```
```powershell
# Windows PowerShell (cp = alias Copy-Item, flagnya -Recurse, bukan -r)
Copy-Item -Recurse template-mfe-child template-mfe-admin
```

Ubah `template-mfe-admin/package.json`:
```json
{
  "name": "@template/mfe-admin",     // ← ganti nama package
  "version": "1.0.0",
  "private": true,
  "scripts": { }                      // biarkan sama (webpack serve, typecheck)
}
```

## Langkah 2 — Konfigurasi Module Federation (Remote)

`template-mfe-admin/webpack.config.cjs` — ganti 2 hal wajib: **name unik** dan **port unik**:

```js
devServer: {
  port: 5007,                         // ← unik per MFE (jangan bentrok)
  historyApiFallback: true,
  hot: true,
  headers: { 'Access-Control-Allow-Origin': '*' },
},
// ...
new ModuleFederationPlugin({
  name: 'adminMFE',                   // ← scope unik; HARUS cocok dengan scope di shell
  filename: 'remoteEntry.js',
  exposes: { './Module': './src/Module.tsx' },
  shared: {
    react:              { singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false },
    'react-dom':        { singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false },
    'react/jsx-runtime':{ singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false },
    'react-router-dom': { singleton: true, requiredVersion: false, eager: false },
    '@tanstack/react-query': { singleton: true, requiredVersion: false },
  },
}),
```
Jangan lupa `output.publicPath: 'auto'` (sudah ada di template child).

**d) Tailwind — pastikan class shared ter-compile.** `tailwind.config.ts` child hasil salinan sudah menyertakan `'../template-shared/src/**/*.{ts,tsx}'` di `content` — **jangan dihapus**. Komponen shared (Button, dll.) tidak punya CSS sendiri; class-nya di-generate oleh Tailwind app pemakainya (lihat insight #10 di [`09`](./09-pola-dan-insight.md)).

## Langkah 3 — Buat Halaman

`template-mfe-admin/src/pages/Users.tsx`:
```tsx
import React from 'react';

const Users: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
    <p className="text-gray-600 mt-1">Kelola pengguna di sini.</p>
  </div>
);

export default Users;
```
`template-mfe-admin/src/pages/Roles.tsx`: sama polanya (ganti judul ke "Roles").

## Langkah 4 — Module.tsx (Mode Federated)

`template-mfe-admin/src/Module.tsx` — routing relatif terhadap `basePath`:
```tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { SharedProvider, LoadingProvider, GlobalLoadingOverlay } from '@template/shared';
import Users from './pages/Users';
import Roles from './pages/Roles';
import NotFound from './pages/NotFound';
import './global.css';

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
}

const ModuleContent: React.FC<ModuleProps> = ({ basePath = '/admin', subRoute }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // 1) subRoute (dikirim shell via LazyMFE)
  if (subRoute === 'users') return <Users />;
  if (subRoute === 'roles') return <Roles />;

  // 2) Fallback: cocokkan path relatif
  const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');
  if (relativePath === '' || relativePath === '/') return <Users />;
  if (relativePath.startsWith('users')) return <Users />;
  if (relativePath.startsWith('roles')) return <Roles />;

  return <NotFound />;
};

const Module: React.FC<ModuleProps> = (props) => (
  <SharedProvider>
    <LoadingProvider>
      <ModuleContent {...props} />
      <GlobalLoadingOverlay />
    </LoadingProvider>
  </SharedProvider>
);

export default Module;
```
> Catatan: `SharedProvider` tanpa props = tanpa auth shell. Bila MFE ini butuh user/permission, lanjut ke Langkah 9 (kontrak auth).

## Langkah 5 — App.tsx (Mode Standalone)

`template-mfe-admin/src/App.tsx`:
```tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Users from './pages/Users';
import Roles from './pages/Roles';
import NotFound from './pages/NotFound';

const App: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="users" replace />} />
    <Route path="users" element={<Users />} />
    <Route path="roles" element={<Roles />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
```

## Langkah 6 — Daftarkan ke Workspace

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-child'
  - 'template-mfe-admin'        # ← tambah
```

Root `package.json` — tambah script dev:
```json
{
  "scripts": {
    "dev:admin": "pnpm --filter @template/mfe-admin dev",
    "dev": "concurrently --names \"shell,child,admin\" --prefix-colors \"yellow,cyan,magenta\" \
      \"pnpm --filter @template/shell dev\" \
      \"pnpm --filter @template/mfe-child dev\" \
      \"pnpm --filter @template/mfe-admin dev\""
  }
}
```
Lalu `pnpm install` agar workspace package baru ter-link.

## Langkah 7 — Daftarkan di Shell

**a) `template-shell/src/routes/routes.tsx`** — tambah di dalam route protected:
```tsx
<Route
  path="/admin/*"
  element={
    <MFEErrorBoundary mfeName="Admin MFE">
      <LazyMFE
        scope="adminMFE"
        module="./Module"
        url={window._env?.getMfeUrl?.('adminMfe') || 'http://localhost:5007/remoteEntry.js'}
        basePath="/admin"
      />
    </MFEErrorBoundary>
  }
/>
```
> Direkomendasikan baca URL dari `env.js` (bukan hard-code) — lihat gap #7 di [`12`](./12-risiko-dan-gap-produksi.md).

**b) `template-shell/public/env.js`** — daftarkan URL MFE baru.

> ⚠️ **File yang ter-serve browser adalah `public/env.js` (stub), BUKAN `template-shell/env.js` (template konfigurasi).** Detil dua file ini: [`08`](./08-environment-config-runtime.md).
> Alur yang benar:
> 1. Salin isi `template-shell/env.js` (template) → `public/env.js`.
> 2. Di hasil salinan, tambah entri `adminMfe`:
```js
const MFE_ROUTES = {
  childMfe: "http://localhost:5006/remoteEntry.js",
  adminMfe: "http://localhost:5007/remoteEntry.js",   // ← tambah
};
```
> Catatan: route `/admin` **tetap jalan** walau langkah ini terlewat, karena `url` di LazyMFE (langkah 7a) punya fallback hardcoded — tapi nilai `env.js` tidak akan dipakai sampai file yang benar diedit.

**c) `template-shell/src/components/Layout/Layout.tsx`** — tambah item navigasi:
```tsx
import { Users } from 'lucide-react';   // ikon baru

const navigation: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
  { id: "child-mfe", name: "Child MFE", href: "/child", icon: LayoutGrid },
  { id: "admin", name: "Admin MFE", href: "/admin", icon: Users },   // ← tambah
];
```

## Langkah 8 — Uji (5 Poin Wajib)

```bash
pnpm dev
```

1. **Standalone**: buka `http://localhost:5007` → route `/users`, `/roles` jalan tanpa shell.
2. **Federated**: buka `http://localhost:5000/admin` → halaman Users tampil di dalam Layout shell (sidebar + topbar tetap).
3. **Sub-route & F5**: buka `/admin/roles` → Roles tampil; tekan F5 → tidak 404.
4. **Singleton**: console → `window.React` ada (satu instance); tidak ada warning "two instances of React".
5. **Error boundary**: `Ctrl+C` admin dev server saja → buka `/admin` → muncul kartu "Admin MFE Not Available", shell tetap hidup.

## Langkah 9 (Opsional) — Kontrak Auth Eksplisit

> ⚠️ **PENTING DIBACA DULU:** `authContext` **BUKAN props bawaan `LazyMFE` saat ini**. Template asli tidak punya wiring auth lintas MFE (lihat gap #2 di [`12`](./12-risiko-dan-gap-produksi.md)). Langkah ini memerlukan **modifikasi 3 file** di bawah — ikuti semua, baru bisa compile.

**File 1 — `template-shell/src/components/LazyMFE.tsx`** (tambah prop & teruskan):

```tsx
import type { AuthContextType } from '@template/shared';   // tambah import

interface LazyMFEProps {
  scope: string;
  module: string;
  url: string;
  version?: string;
  fallback?: React.ReactNode;
  basePath?: string;
  subRoute?: string;
  authContext?: AuthContextType;    // ← tambah (opsional)
}
```
Di bagian render (akhir komponen), teruskan ke remote:
```tsx
<Component basePath={basePath} subRoute={subRoute} authContext={authContext} />
```

**File 2 — `template-shell/src/routes/routes.tsx`** (bungkus dengan komponen yang membaca auth shell):

```tsx
// routes.tsx sudah meng-import useAuth dari '../contexts/AuthContext'
const AdminMFE: React.FC = () => {
  const authContext = useAuth();    // hook SHELL — isi user/permission nyata
  return (
    <MFEErrorBoundary mfeName="Admin MFE">
      <LazyMFE
        scope="adminMFE"
        module="./Module"
        url={window._env?.getMfeUrl?.('adminMfe') || 'http://localhost:5007/remoteEntry.js'}
        basePath="/admin"
        authContext={authContext}
      />
    </MFEErrorBoundary>
  );
};
// lalu: <Route path="/admin/*" element={<AdminMFE />} />
```
> `useAuth` shell menghasilkan objek yang strukturnya sama dengan `AuthContextType` shared (`user`, `login`, `hasPermission`, dll.) → aman dilewatkan.

**File 3 — `template-mfe-admin/src/Module.tsx`** (terima & teruskan ke SharedProvider):

```tsx
import { SharedProvider, LoadingProvider, GlobalLoadingOverlay, type AuthContextType } from '@template/shared';

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
  authContext?: AuthContextType;    // ← tambah
}

const Module: React.FC<ModuleProps> = ({ authContext, ...props }) => (
  <SharedProvider authContext={authContext}>
    <LoadingProvider>
      <ModuleContent {...props} />
      <GlobalLoadingOverlay />
    </LoadingProvider>
  </SharedProvider>
);
```

**Pemakaian di halaman:**
```tsx
import { useAuth } from '@template/shared';   // useAuth SHARED, bukan shell
const { user, hasPermission } = useAuth();
if (!hasPermission('users:view')) return <p>403</p>;
```

**Alternatif tanpa modifikasi LazyMFE** (pola yang sudah dipakai `services/api.ts` child): child membaca token dari `sastStorage` lalu memanggil `/Auth/profile` sendiri saat mount. Lebih sederhana, tapi profil di-fetch dua kali (shell + child) dan ada delay render pertama.

## Checklist Akhir

```
□ name package unik (@template/mfe-admin)
□ MF name unik (adminMFE) === scope di LazyMFE
□ port unik (5007), historyApiFallback + CORS header ada
□ shared: singleton:true semua; eager:false
□ Module.tsx: routing relatif terhadap basePath
□ App.tsx: standalone route
□ pnpm-workspace.yaml + dev script + pnpm install
□ routes.tsx (MFEErrorBoundary + LazyMFE) + env.js MFE_ROUTES + Layout nav
□ Uji: standalone ✓ federated ✓ F5 ✓ singleton ✓ error boundary ✓
```

---
Lanjut ke [**11. Migrasi Monolith → MFE**](./11-migrasi-monolith-ke-mfe.md)