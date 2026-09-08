# Bagian 03 — Shared Library (@template/shared)

## Peran

Satu sumber kebenaran untuk kode yang dipakai 2+ package: UI components, contexts,
hooks, utils, api client, event bus, types. Di-dev tanpa build step (webpack alias
langsung ke `../template-shared/src`), di-produksi di-build ke `dist/` ESM.

## Dual-mode resolution

- **Dev**: shell & child punya alias webpack
  `'@template/shared': path.resolve(__dirname, '../template-shared/src')` +
  `resolve.modules` tambahan ke folder src shared. Jadi HMR langsung, tanpa `pnpm build:shared`.
- **Prod/publish**: `package.json` shared punya `exports` map per subpath
  (`.`, `./components`, `./components/ui`, `./hooks`, `./contexts`, `./lib`, `./types`)
 yang menunjuk ke `dist/*.js` + `.d.ts`.
- `ts-loader` shell mengecualikan node_modules KECUALI `@template`
  (`exclude: /node_modules[\\\/](?!@template)/`) agar source shared ikut di-compile.
- `peerDependencies`: react, react-dom, react-router-dom, @tanstack/react-query
  → hindari duplikasi instance React.

## Build: `tsc && node scripts/fix-imports.cjs`

`tsc` emit ESM tanpa ekstensi pada import relatif (invalid di Node ESM murni).
`fix-imports.cjs` post-process semua `.js` di `dist/`:
- regex `from '...relatif...'` dan `export * from '...'`
- resolve: kalau ada file `X.js` → `X.js`; kalau direktori → `X/index.js`.

## Isi per modul

### components/ui (shadcn-style, Radix + CVA + tailwind-merge)
- `button.tsx` — variants via `class-variance-authority`, `Slot` dari Radix (asChild).
- `card.tsx`, `input.tsx`, `label.tsx` (Radix Label)
- `dropdown-menu.tsx` (Radix), `tooltip.tsx` (Radix + TooltipProvider)
- `sonner.tsx` — wrapper `<Toaster>` (toast) diekspos sebagai `SonnerToaster`

### components/common
- `LoadingSpinner`, `PageLoader` (full-page loader, dipakai LazyMFE/ProtectedRoute)
- `ErrorFallback` / `MFEErrorFallback` (dipakai MFEErrorBoundary, punya tombol reset)
- `GlobalLoadingOverlay` (overlay driven by LoadingContext)

### contexts/SharedContext.tsx — inti sharing lintas MFE

```ts
interface SharedContextType {
  queryClient: QueryClient;
  authContext: AuthContextType;   // user, isAuthenticated, login, logout, hasPermission, hasRole
  apiBaseUrl: string;
  eventBus: EventBusInstance;
}
```

- `SharedProvider` menerima props opsional `queryClient`, `authContext`, `apiBaseUrl`
  — **shell meng-inject authContext aslinya** (`SharedAuthProvider` di bootstrap shell),
  child MFE yang standalone jatuh ke `defaultAuthContext` (no-op, isAuthenticated false).
- `useSharedContext()` TIDAK throw kalau tanpa provider — return
  `defaultFallbackContext` (graceful degradation, penting saat standalone dev).

### contexts/LoadingContext.tsx
- `useLoading()` → `{ isLoading, loadingMessage, showLoading(msg?), hideLoading() }`
- throw kalau dipakai di luar `LoadingProvider`.
- `GlobalLoadingOverlay` merender overlay berdasarkan context ini.

### hooks
- `useAuth()` (shared) = shortcut `useSharedContext().authContext` —
  child MFE pakai ini untuk baca auth dari shell.
- `useEventBus()` → `{ subscribe, publish, once, events }`; semua subscription
  dilacak di ref dan **di-unsubscribe otomatis saat unmount**.
- `useEventSubscription(event, callback, deps)` — subscribe sekali per event.

### lib/eventBus.ts — komunikasi antar MFE
- Singleton pub/sub: `Map<string, Set<callback>>`; `publish` membungkus tiap
  callback dalam try/catch (satu handler error tidak memutus yang lain).
- `subscribe`/`once` return fungsi unsubscribe.
- Konstanta `MFE_EVENTS` (typed, `as const`):
  - navigasi: `mfe:navigate`, `mfe:navigation_complete`
  - auth: `auth:logged_in`, `auth:logged_out`, `auth:session_expired`, `auth:token_refreshed`
  - data: `data:updated`, `cache:invalidate`
  - ui: `ui:notification`, `ui:modal_open`, `ui:modal_close`, `ui:sidebar_toggle`
  - error: `mfe:error`, `api:error`

### lib/api.ts — createApiClient (factory)
- Config: `{ baseUrl, getToken, onUnauthorized? }`.
- Method: get/post/put/patch/delete; selalu `credentials: 'include'` +
  header `Authorization: Bearer <token>` kalau ada.
- `handleResponse`: 401 → panggil `onUnauthorized()` + throw 'Unauthorized';
  403 & !ok → throw object `ApiError { message, status, details }`; 204 → `{}`.
- Type helper: `export type ApiClient = ReturnType<typeof createApiClient>`.

### lib/env.ts — akses window._env dengan fallback
- `getApiUrl(service)` → `_env.getApiUrl` atau fallback port hard-coded
  (auth 5139, workflow 5224, rules 5227, dedup 5084, portfolio 5091,
  screening 5291, partnership/common 5062).
- `getApiBaseUrl()`, `getEnvMode()`, `getEnvConfig()`, `getAllApiUrls()` —
  semuanya aman dipanggil tanpa `_env` (warn + fallback localhost).

### lib/utils.ts
- `cn()` = `twMerge(clsx(...))` — pola standar shadcn.
- `formatDate` / `formatDateTime` (Intl en-US), `formatCurrency` (Intl id-ID, default IDR, 0 desimal).
- `debounce`, `throttle` generik typed.

## Pola konsumsi di child

`Module.tsx` child membungkus konten dengan `SharedProvider` + `LoadingProvider` +
`GlobalLoadingOverlay`, sehingga komponen shared yang butuh context tetap jalan
baik standalone maupun di dalam shell.
