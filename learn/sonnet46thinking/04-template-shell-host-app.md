# 04. template-shell — Host App
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Struktur `src/`

```
src/
├── App.tsx               ← root component, render <AppRoutes>
├── bootstrap.tsx         ← ReactDOM.createRoot (entry point React)
├── index.tsx             ← import('./bootstrap') — dynamic import!
├── global.css
├── components/
│   ├── Layout.tsx        ← Sidebar + TopBar wrapper
│   ├── LazyMFE.tsx       ← loader dinamis remote MFE
│   └── ErrorBoundary.tsx ← MFEErrorBoundary (React Error Boundary)
├── contexts/
│   └── AuthContext.tsx   ← auth state lokal shell (login/logout/token)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── NotFound.tsx
├── routes/
│   ├── routes.tsx        ← TITIK UTAMA: daftarkan semua MFE di sini
│   └── ProtectedRoute.tsx
└── utils/
    └── sharedDependencies.ts ← initSharedDependencies()
```

## Provider Stack (bootstrap.tsx)

Urutan provider dari luar ke dalam:

```tsx
<React.StrictMode>
  <QueryClientProvider client={queryClient}>   {/* TanStack Query */}
    <BrowserRouter>                             {/* React Router */}
      <AuthProvider>                            {/* owns auth state */}
        <SharedAuthProvider>                   {/* bridge auth ke SharedProvider */}
          <LoadingProvider>                    {/* global loading overlay */}
            <TooltipProvider>                 {/* shadcn tooltip */}
              <App />
              <SonnerToaster />               {/* toast notifications */}
              <GlobalLoadingOverlay />        {/* full-screen loading */}
            </TooltipProvider>
          </LoadingProvider>
        </SharedAuthProvider>
      </AuthProvider>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
</React.StrictMode>
```

**SharedAuthProvider** adalah bridge penting:
```tsx
const SharedAuthProvider = ({ children }) => {
  const authContext = useAuth();  // dari AuthProvider lokal shell
  return <SharedProvider authContext={authContext}>{children}</SharedProvider>;
  // SharedProvider dari @template/shared — bisa diakses child MFE
};
```

## QueryClient Default Config

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,          // 5 menit — data dianggap fresh
      gcTime: 30 * 60 * 1000,            // 30 menit — cache setelah unmount
      retry: (failureCount, error) => {
        if (error.status >= 400 && error.status < 500) return false; // skip 4xx
        return failureCount < 3;          // max 3x retry untuk 5xx
      },
      refetchOnWindowFocus: false,        // tidak auto-refetch saat switch tab
    },
    mutations: {
      retry: false,                       // mutasi tidak di-retry
    },
  },
});
```

## routes/routes.tsx — Cara Menambah MFE Baru

```tsx
export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — semua dalam Layout */}
      <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ← TAMBAH MFE BARU DI SINI */}
        <Route
          path="/child/*"                {/* /* WAJIB untuk sub-route */}
          element={
            <MFEErrorBoundary mfeName="Child MFE">
              <LazyMFE
                scope="childMFE"         {/* cocok dengan name di webpack remote */}
                module="./Module"        {/* cocok dengan exposes key */}
                url="http://localhost:5006/remoteEntry.js"
                basePath="/child"
              />
            </MFEErrorBoundary>
          }
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={isAuthenticated ? <NotFound /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};
```

### Tips Routing Shell

| Aturan | Penjelasan |
|--------|-----------|
| `path="/admin/*"` | **WAJIB** gunakan `/*` agar sub-route child MFE berjalan |
| `basePath="/admin"` | Kirim ke LazyMFE agar child tahu base URL-nya |
| `scope="adminMFE"` | Harus cocok dengan `name` di webpack.config.cjs child |
| `module="./Module"` | Harus cocok dengan key di `exposes` webpack child |

---
*Lanjut → [05. template-mfe-child](./05-template-mfe-child-remote-mfe.md)*
