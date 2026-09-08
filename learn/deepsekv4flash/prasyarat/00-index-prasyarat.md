# 00 — Index & Jalur Belajar Prasyarat

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

Seri 7 file ini adalah **pintu masuk** sebelum membaca catatan utama di `learn/deepsekv4flash/`. Catatan utama berasumsi pembaca sudah lancar React, JavaScript ES6+, dan TypeScript dasar. Jika kamu programmer (paham variabel, loop, function, OOP) tapi **belum pernah menyentuh frontend**, baca seri ini dulu.

Tujuan akhirnya bukan menjadi React expert, melainkan: **mampu membaca kode di `learn/deepsekv4flash/` dan file `.tsx` di repo dengan percaya diri**.

## Jalur Belajar Prasyarat

Baca **berurutan** — setiap file memberi dasar untuk file berikutnya:

| # | File | Yang Kamu Kuasai Setelah Membaca | Estimasi |
|---|------|----------------------------------|----------|
| 01 | [JavaScript ES6+](./01-javascript-es6.md) | Arrow function, destructuring, spread/rest, async/await, ES Modules, `?.` dan `\|\|` | 45–60 menit |
| 02 | [TypeScript Dasar](./02-typescript-dasar.md) | Annotation, `interface` vs `type`, Generic `<T>`, `React.FC<Props>`, `as const`, `ReturnType<typeof fn>` | 45–60 menit |
| 03 | [React Dasar](./03-react-dasar.md) | Component, JSX, props, conditional render, list + `key`, controlled form | 60–75 menit |
| 04 | [React Hooks](./04-react-hooks.md) | `useState`, `useEffect` + cleanup, `useContext`, `useRef`, `useMemo`, `useCallback` | 75–90 menit ⭐ |
| 05 | [React Router Dasar](./05-react-router-dasar.md) | `Routes`/`Route`, `Link` vs `Navigate`, `useLocation`, `Outlet`, wildcard route | 45–60 menit |
| 06 | [Siap Masuk ke Catatan MFE](./06-siap-masuk-mfe.md) | Mental model: setiap pola prasyarat dipetakan ke file catatan utama | 30 menit |

> ⭐ File **04 (Hooks)** adalah yang paling kritis — hooks adalah fondasi hampir semua kode di repo ini (context, event bus, auth, cache). Jangan dilewati.

## Peta: Prasyarat ↔ Catatan Utama

| Materi prasyarat | Akan kamu temukan di catatan utama |
|------------------|------------------------------------|
| ES6+ (`async/await`, destructuring, spread) | [`07-auth-routing-eventbus.md`](../07-auth-routing-eventbus.md) — fetch login & profil |
| TypeScript (`React.FC`, Generic, `as const`) | [`06-shared-library.md`](../06-shared-library.md) — types, api client, `MFE_EVENTS` |
| React component & props | [`06-shared-library.md`](../06-shared-library.md) — UI components |
| Hooks (khususnya `useEffect` + cleanup) | [`07-auth-routing-eventbus.md`](../07-auth-routing-eventbus.md) — EventBus subscription |
| React Router | [`05-child-mfe-remote.md`](../05-child-mfe-remote.md) — `Module.tsx`; [`04-shell-host.md`](../04-shell-host.md) — routes shell |
| `Invalid hook call` (singleton React) | [`03-module-federation-webpack.md`](../03-module-federation-webpack.md) |

## Cara Membaca Seri Ini

1. **Setiap file punya contoh dari kode nyata repo** — buka file yang dirujuk (mis. `template-shell/src/pages/Login.tsx:15`) dan baca konteksnya langsung. Jangan percaya catatan buta.
2. Contoh dengan label `// ❌ Jangan` dan `// ✅ Benar` menunjukkan **kesalahan umum** yang akan kamu temui (baik di kode orang lain maupun di artikel blog usang).
3. Blok `> ⚡ Gotcha:` / `> ⚠️` adalah perangkap yang paling sering membingungkan pembaca pemula. Pahami, jangan hanya baca.
4. Selesai 01–05, jangan langsung loncat ke catatan utama — baca dulu file **[06-siap-masuk-mfe.md](./06-siap-masuk-mfe.md)** yang menyatukan semuanya dan memetakan ke nomor file induk.

## Setelah Seri Ini

Kembali ke index utama: [**`catatan_deepsekv4flash.md`**](../catatan_deepsekv4flash.md), lalu mulai dari `01-konsep-dan-mental-model.md` sesuai jalur belajarnya (fase 1 → 7). File [`14-ujian-dan-cheatsheet.md`](../14-ujian-dan-cheatsheet.md) bisa jadi ujian akhirmu.

---

Lanjut ke [**01. JavaScript ES6+ untuk Membaca MFE**](./01-javascript-es6.md)