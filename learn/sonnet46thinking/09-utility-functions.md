# 09. Utility Functions
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

File: `template-shared/src/lib/utils.ts`

---

## cn() — Tailwind Class Merger

```typescript
import { cn } from '@template/shared';

// Gabungkan class Tailwind, resolve konflik
cn('px-4 py-2', condition && 'bg-blue-500', 'hover:bg-blue-600')
// Menggunakan: clsx (conditional classes) + twMerge (resolve Tailwind conflicts)
```

**Kasus penggunaan:**
```tsx
<div className={cn(
  'base-class p-4',
  isActive && 'bg-blue-100',
  isError && 'border-red-500',
  className,   // props dari parent
)}>
```

## formatDate() — Format Tanggal

```typescript
import { formatDate } from '@template/shared';

formatDate(new Date())           // → "Sep 8, 2026"
formatDate('2026-01-15')        // → "Jan 15, 2026"
```

Menggunakan `Intl.DateTimeFormat('en-US', { year:'numeric', month:'short', day:'numeric' })`

## formatDateTime() — Format Tanggal + Waktu

```typescript
import { formatDateTime } from '@template/shared';

formatDateTime(new Date())       // → "Sep 8, 2026, 09:56 AM"
```

Menggunakan `Intl.DateTimeFormat('en-US', { ..., hour:'2-digit', minute:'2-digit' })`

## formatCurrency() — Format Mata Uang IDR

```typescript
import { formatCurrency } from '@template/shared';

formatCurrency(1000000)          // → "Rp 1.000.000"
formatCurrency(50000)            // → "Rp 50.000"
formatCurrency(75000, 'USD')     // → "$75,000"
```

Menggunakan `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' })`  
Default currency: **IDR** (Rupiah)

## debounce() — Delay Eksekusi

```typescript
import { debounce } from '@template/shared';

// Hanya eksekusi setelah 300ms setelah terakhir dipanggil
const handleSearch = debounce((query: string) => {
  searchAPI(query);
}, 300);

// Penggunaan di React
const debouncedSearch = useMemo(() => debounce(search, 300), []);
```

**Use case:** search input, resize handler, scroll handler

## throttle() — Batasi Frekuensi Eksekusi

```typescript
import { throttle } from '@template/shared';

// Maksimal eksekusi sekali per 500ms, tidak peduli berapa kali dipanggil
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 500);
```

**Perbedaan debounce vs throttle:**
| | debounce | throttle |
|--|---------|---------|
| Trigger | Setelah berhenti N ms | Setiap N ms sekali |
| Use case | Search input | Scroll/resize listener |
| Jika terus dipanggil | Terus menunda | Tetap eksekusi reguler |

---
*Lanjut → [10. Konfigurasi Webpack](./10-konfigurasi-webpack-module-federation.md)*
