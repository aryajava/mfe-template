# 06. template-shared — Shared Library
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Struktur `src/`

```
src/
├── index.ts              ← barrel export semua (satu titik import)
├── components/
│   ├── index.ts
│   ├── ui/               ← UI primitives (shadcn-style)
│   │   ├── button.tsx    ← Button dengan variants
│   │   ├── card.tsx      ← Card, CardHeader, CardContent, CardFooter
│   │   ├── input.tsx     ← Input
│   │   ├── label.tsx     ← Label
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx   ← Tooltip, TooltipProvider
│   │   └── sonner.tsx    ← SonnerToaster
│   └── common/           ← komponen umum lintas MFE
│       └── (LoadingSpinner, ErrorFallback, PageLoader, GlobalLoadingOverlay)
├── contexts/
│   ├── SharedContext.tsx ← auth + query client shared state
│   └── LoadingContext.tsx← global loading state
├── hooks/
│   ├── index.ts
│   ├── useAuth.ts        ← akses auth dari SharedContext
│   └── useEventBus.ts    ← subscribe/publish event antar MFE
├── lib/
│   ├── index.ts
│   ├── api.ts            ← createApiClient factory function
│   ├── env.ts            ← environment helpers
│   ├── eventBus.ts       ← singleton EventBus + MFE_EVENTS
│   └── utils.ts          ← cn, formatDate, formatCurrency, debounce, throttle
├── styles/
└── types/
```

## Barrel Export — index.ts

```typescript
// index.ts — satu pintu masuk
export * from './components';
export * from './components/ui';
export * from './components/common';
export * from './contexts';
export * from './hooks';
export * from './lib';
export * from './types';
```

Cara import di MFE lain:
```typescript
import {
  Button, Card, Input,
  SharedProvider, LoadingProvider,
  useAuth, useEventBus,
  createApiClient, eventBus, MFE_EVENTS,
  cn, formatDate, formatCurrency,
} from '@template/shared';
```

## Apa yang Harus Di-extract ke Shared?

| ✅ Extract (dipakai ≥ 2 MFE) | ❌ Jangan Extract |
|-----------------------------|-----------------|
| UI primitives: Button, Card, Input, Table | Page components (hanya 1 MFE) |
| Common components: LoadingSpinner, ErrorFallback | Domain business logic |
| Auth context, Theme context, Loading context | MFE-specific API calls |
| `useAuth`, `useEventBus`, `useDebounce` | State management lokal MFE |
| API client factory, formatters, validators | MFE-specific utils |
| Shared TypeScript types/interfaces | |

## SharedContext — Titik Sentral Auth

```typescript
// SharedContext menyediakan:
interface SharedContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  queryClient: QueryClient;
}
```

**Flow auth:**
```
Shell AuthProvider → SharedProvider(authContext) → [via Module Federation] → child useAuth()
```

Child MFE wrap Module.tsx dengan `<SharedProvider>` untuk receive auth dari shell.

## UI Components (shadcn-style)

Semua UI components menggunakan **Tailwind CSS** + **class-variance-authority (CVA)** untuk variants:

```tsx
// Contoh penggunaan
<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>

<Card>
  <CardHeader><CardTitle>Judul</CardTitle></CardHeader>
  <CardContent>Konten</CardContent>
</Card>

<Input placeholder="Email" type="email" />
<Label htmlFor="email">Email</Label>
```

---
*Lanjut → [07. EventBus](./07-komunikasi-antar-mfe-eventbus.md)*
