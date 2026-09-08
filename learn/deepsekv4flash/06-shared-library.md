# 06 — Shared Library (`@template/shared`)

> Fase 4 dari Jalur Belajar. Bagian terakhir: kode yang dipakai semua MFE.

Package `template-shared`, ESM (`"type": "module"`), build dengan `tsc` + `scripts/fix-imports.cjs`. Re-export semuanya dari `src/index.ts`.

## Struktur

```
src/
├── index.ts            # export * dari components, contexts, hooks, lib, types
├── components/
│   ├── ui/             button, card, input, label, tooltip, dropdown-menu, sonner
│   └── common/         LoadingSpinner(+PageLoader), GlobalLoadingOverlay, ErrorFallback(+MFEErrorFallback)
├── contexts/           SharedContext, LoadingContext
├── hooks/              useAuth, useEventBus(+useEventSubscription)
├── lib/                utils, eventBus, api, env
├── types/              common types
└── styles/globals.css  tema HSL light/dark
```

## UI Components (gaya shadcn)

- **button.tsx**: `Button` (forwardRef) + `buttonVariants` (cva). Variant: `default, destructive, outline, secondary, ghost, link`. Size: `default, sm, lg, icon`. Prop `asChild` (pakai `@radix-ui/react-slot`) → bisa jadi `<Link>` dsb.
- **card.tsx**: `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`.
- **input.tsx**: `Input` (forwardRef) dengan styling standar.
- **label.tsx**: `Label` (cva + Slot).
- **tooltip.tsx**: `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` (Radix), content `sideOffset=4`.
- **dropdown-menu.tsx**: `DropdownMenu(Trigger/Content/Item/Label/Separator/Group/Sub)` (Radix, Content via Portal).
- **sonner.tsx**: re-export `sonner`.
- **ui/index.ts**: re-export semua + `export { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'`.

## Common Components

- **LoadingSpinner**: `size sm|md|lg`, spinner animasi. **PageLoader**: center spinner besar (`minHeight: 60vh`).
- **GlobalLoadingOverlay**: full-screen overlay (`z-[9999]`, `bg-black/50 backdrop-blur`), menampilkan `LoadingSpinner` + `loadingMessage`; aktif via `useLoading()`.
- **ErrorFallback**: kartu error + tombol "Try Again" (`resetErrorBoundary`). **MFEErrorFallback**: varian khusus MFE dengan title `"{mfeName} failed to load"`.

## Contexts

### SharedContext (`contexts/SharedContext.tsx`)
- Mendefinisikan `User`, `AuthContextType`, `SharedContextType`:
  ```ts
  interface SharedContextType {
    queryClient: QueryClient;
    authContext: AuthContextType;
    apiBaseUrl: string;
    eventBus: EventBusInstance;
  }
  ```
- `useSharedContext()`: **tidak throw** bila di luar provider — mengembalikan `defaultFallbackContext` (QueryClient baru, auth default, apiBaseUrl dari `getApiBaseUrl()`, eventBus global).
- `SharedProvider` props opsional: `queryClient`, `authContext`, `apiBaseUrl`; nilai default bila kosong. Memakai `useMemo`.

### LoadingContext (`contexts/LoadingContext.tsx`)
- `useLoading()` → `{ isLoading, loadingMessage, showLoading(msg?), hideLoading() }`.
- `useLoading` **throw** bila di luar `LoadingProvider` (beda dengan SharedContext).

## Hooks

- **useAuth** (`hooks/useAuth.ts`): `const { authContext } = useSharedContext(); return authContext;` — pintasan untuk mengakses auth context.
- **useEventBus** (`hooks/useEventBus.ts`):
  - `subscribe`, `publish`, `once` (membungkus `eventBus`), plus `events` = `MFE_EVENTS`.
  - Menyimpan unsubscribe di `subscriptionsRef` dan auto-unsubscribe saat unmount.
  - `useEventSubscription(event, callback, deps)` — hook khusus subscribe dengan cleanup otomatis.

## Lib

### utils.ts
- `cn(...inputs)` = `twMerge(clsx(inputs))` — gabung class Tailwind.
- `formatDate(date|string)` — `en-US`, yyyy mon d.
- `formatDateTime` — + jam:menit.
- `formatCurrency(amount, currency='IDR')` — `id-ID`, tanpa desimal.
- `debounce(fn, wait)` dan `throttle(fn, limit)`.

### eventBus.ts
- Class `EventBus` (Map `event → Set<callback>`): `subscribe` (return unsubscribe), `publish` (try/catch per callback), `once`.
- Ekspor singleton `eventBus`.
- `MFE_EVENTS` (const object):
  - Navigasi: `NAVIGATE_TO` (mfe:navigate), `NAVIGATION_COMPLETE`
  - Auth: `USER_LOGGED_IN`, `USER_LOGGED_OUT`, `SESSION_EXPIRED`, `TOKEN_REFRESHED`
  - Data: `DATA_UPDATED`, `CACHE_INVALIDATE`
  - UI: `NOTIFICATION_SHOW`, `MODAL_OPEN`, `MODAL_CLOSE`, `SIDEBAR_TOGGLE`
  - Error: `MFE_ERROR`, `API_ERROR`
- Type `MFEEventType`.

### api.ts — `createApiClient(config)`
- Config: `{ baseUrl, getToken, onUnauthorized? }`.
- `getAuthHeaders()`: `Content-Type: application/json` + `Authorization: Bearer <token>` bila ada.
- `handleResponse`:
  - 401 → panggil `onUnauthorized()` lalu throw `new Error('Unauthorized')`.
  - 403 → throw `ApiError { message, status: 403, details }`.
  - !ok → throw `ApiError` dari body JSON (fallback 'Request failed').
  - 204 → return `{} as T`.
  - else → `response.json()`.
- Methods: `get, post, put, patch, delete` — semua `credentials: 'include'`.
- Type `ApiClient = ReturnType<typeof createApiClient>`.

### env.ts — Helper akses `window._env`
- `getApiUrl(serviceName)`: pakai `window._env.getApiUrl` bila ada; fallback map port: auth 5139, workflow 5224, rules 5227, dedup 5084, portfolio 5091, screening 5291, partnership/common 5062; default 5000.
- `getAllApiUrls()`: dari `window._env.API_URLS` atau fallback map.
- `getApiBaseUrl()`: `window._env.API_BASE_URL` atau fallback `http://localhost:5139/api`.
- `getEnvMode()`: `window._env.MODE` atau `'local'`.
- `getEnvConfig()`: `window._env` atau default.

## Types (`types/common.ts`)
- `PaginatedResponse<T>`: data[], total, page, pageSize, totalPages.
- `ApiResponse<T>`: success, data, message.
- `SelectOption` { label, value }.
- `TableColumn<T>`: key, label, sortable?, render?.
- `FilterConfig` (type text|select|date|number + options), `SortConfig`, `PaginationConfig`.
- `types/index.ts` juga re-export `User, AuthContextType, SharedContextType` dari SharedContext.

## Build Shared (`scripts/fix-imports.cjs`)

- Masalah: TS dengan `moduleResolution: bundler` tidak menulis ekstensi `.js` pada import relatif, tapi Node ESM butuh ekstensi eksplisit.
- Script ini berjalan setelah `tsc`:
  - Rekursif scan `dist/**/*.js`.
  - Untuk setiap `from '…'` / `export * from '…'` relatif (`.`/`..`), cek apakah target `importPath + '.js'` ada, atau `importPath/index.js` ada → ganti jadi ekstensi `.js` / `/index.js`.
  - Tulis ulang file.
- Build: `"build": "tsc && node scripts/fix-imports.cjs"`.

## Catatan: Keketatan TypeScript Berbeda per Package

| Package | strict | noImplicitAny | noUnused* |
|---------|:------:|:-------------:|:---------:|
| `template-shared` | ✅ `true` | ketat | ketat |
| `template-shell` | ❌ `false` | `false` | `false` |
| `template-mfe-child` | ❌ `false` | `false` | `false` |

Shared dibangun sebagai **library yang diekspor publik** → harus paling ketat. Shell & child (aplikasi) memilih longgar untuk kecepatan. Saat menulis kode baru di shared, ikuti `strict: true`; di app, andalkan `pnpm typecheck` ditambah disiplin pribadi.

### Alasan pilihan `tsconfig.json` lain (sama di 3 package)

| Opsi | Nilai | Kenapa |
|------|-------|--------|
| `target` / `lib` | ES2020 + DOM | Target browser modern; runtime app React 18 sudah aman tanpa polyfill berat |
| `module` / `moduleResolution` | ESNext / `bundler` | Diizinkan import **tanpa ekstensi** dan resolve alias (`@/*`, `@template/shared` ke source) — bundler (webpack) yang menyelesaikannya. Konsekuensi: output `dist` shared butuh `fix-imports.cjs` |
| `jsx` | `react-jsx` | JSX transform modern — **tidak perlu** `import React from 'react'` di tiap file |
| `isolatedModules` | `true` | `ts-loader` memproses file satu per satu (transpile per file) |
| `skipLibCheck` | `true` | Lewati cek type `node_modules` → typecheck lebih cepat |
| `paths` | `@/*` → `./src/*` (ketiga package) + `@template/shared` → `../template-shared/src` (shell & child) | Alias lokal + konsisten dengan alias webpack → dev tanpa build shared |
| `declaration`+`declarationMap` (shared saja) | `true` | Shared dipublish → butuh `.d.ts` untuk konsumen |

> Catatan debugging TS: error TS yang "misterius" di shell/child bisa berasal dari `strict: false` (mis. variabel `any` diam-diam lolos) — jangan asumsikan codebase bebas TS error hanya karena build webpack sukses (`transpileOnly` + strict off). Selalu jalankan `pnpm typecheck`.

## Styles (`styles/globals.css`) — Theming HSL & Dark Mode

`styles/globals.css` dan `src/global.css` (shell/child) mendefinisikan **design token CSS variable** format HSL:

```css
:root {
  --primary: 24 95% 53%;          /* hue saturation lightness — oranye */
  --background: 0 0% 100%;
  --radius: 0.5rem;
  --sidebar-background: 0 0% 98%;
  ...
}
.dark { --background: 20 14% 10%; ... }
```

Cara kerjanya:
1. **Tailwind config** memetakan token ke utility: `primary: 'hsl(var(--primary))'` → class `bg-primary`, `text-primary`, dst. memakai nilai HSL token saat runtime.
2. **Dark mode** dikontrol class: `darkMode: ['class']` + blok `.dark {}` menimpa token → pasang class `.dark` di `<html>` untuk tema gelap (belum ada toggle UI di template, tapi mekanismenya siap).
3. **Kenapa HSL bukan hex?** Format `24 95% 53%` memudahkan menulis `hsl(var(--x) / <opacity>)` bila butuh variasi transparansi.
4. Token **sidebar-*** dipakai komponen Layout shell; token `--ring`, `--border`, `--input` dipakai state focus/disabled komponen UI shared.

Aturan base penting: `* { @apply border-border; }`, body `bg-background text-foreground` + font Inter, `overflow-wrap: anywhere` pada teks, `pre/code` scroll horizontal.
