# 05. template-mfe-child — Remote MFE
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Struktur `src/`

```
src/
├── Module.tsx      ← entry point Federation (di-expose ke shell)
├── App.tsx         ← standalone mode routes
├── bootstrap.tsx   ← standalone ReactDOM.createRoot
├── index.tsx       ← import('./bootstrap') — dynamic import
├── global.css      ← CSS Tailwind direktif
├── pages/
│   ├── Home.tsx
│   └── NotFound.tsx
├── services/       ← API calls spesifik MFE ini
└── utils/          ← utilities spesifik MFE ini
```

## Dua Mode Operasi

### Mode 1: Standalone (Development / Testing Mandiri)

```
User akses: http://localhost:5006
    ↓
index.tsx → import('./bootstrap')
    ↓
bootstrap.tsx → ReactDOM.createRoot
  + BrowserRouter (punya sendiri)
  + QueryClientProvider (punya sendiri)
  + AuthProvider (mock/standalone)
  ↓
App.tsx → routes standalone
```

### Mode 2: Federated (Dimuat Shell)

```
Shell load: http://localhost:5006/remoteEntry.js
    ↓
LazyMFE → window.childMFE.get('./Module')
    ↓
Module.tsx → di-render di dalam Layout shell
  (TIDAK ada BrowserRouter baru — pakai dari shell)
  (TIDAK ada QueryClientProvider baru — pakai dari shell)
```

## Module.tsx — Pola Standar

```tsx
interface ModuleProps {
  basePath?: string;   // default '/child'
  subRoute?: string;   // sub-route opsional dari shell
}

// Inner component: routing logic
const ModuleContent: React.FC<ModuleProps> = ({ basePath = '/child', subRoute }) => {
  const location = useLocation();  // dari shell BrowserRouter!
  const currentPath = location.pathname;

  // Strip basePath untuk dapat path relatif
  const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');

  // Routing berdasarkan relativePath
  if (relativePath === '' || relativePath === '/') return <Home />;
  // if (relativePath.startsWith('settings')) return <Settings />;
  // if (subRoute === 'detail') return <Detail />;

  return <NotFound />;
};

// Outer wrapper: inject providers dari shared library
const Module: React.FC<ModuleProps> = (props) => (
  <SharedProvider>         {/* WAJIB — receive auth context dari shell */}
    <LoadingProvider>      {/* loading overlay untuk MFE ini */}
      <ModuleContent {...props} />
      <GlobalLoadingOverlay />
    </LoadingProvider>
  </SharedProvider>
);

export default Module;
```

### Kenapa SharedProvider Wajib di Module.tsx?

Ketika child MFE dimuat shell:
1. Shell punya `SharedProvider` dengan auth context
2. Module Federation share instance SharedContext yang sama
3. Child MFE perlu re-wrap dengan `<SharedProvider>` agar `useAuth()` di dalamnya bekerja

Tanpa `<SharedProvider>` di Module.tsx → `useAuth()` return undefined.

## App.tsx — Standalone Routes

```tsx
const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/home" element={<Home />} />
    {/* Tambah routes standalone di sini */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
```

## Pola Path-Based Routing

```
Shell mengakses: /admin/users/123

Module.tsx menerima:
  basePath = "/admin"
  currentPath = "/admin/users/123"

Perhitungan:
  relativePath = "/admin/users/123".replace("/admin", "").replace(/^\//, "")
               = "users/123"

Routing:
  if (relativePath.startsWith('users')) return <Users />;
```

---
*Lanjut → [06. template-shared](./06-template-shared-shared-library.md)*
