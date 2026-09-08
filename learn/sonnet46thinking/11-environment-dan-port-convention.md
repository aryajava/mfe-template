# 11. Environment & Port Convention
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## env.js — Runtime Config (bukan Build-time)

File: `template-shell/env.js`

```javascript
// Dimuat sebagai <script> di index.html sebelum bundle JS
window.__ENV__ = {
  AUTH_API_URL: 'http://localhost:5139',
  // ...
};

const MICROSERVICE_PORTS = {
  auth: 5139,
};

const MFE_ROUTES = {
  childMfe: "http://localhost:5006/remoteEntry.js",
  // tambah MFE baru di sini:
  // adminMfe: "http://localhost:5007/remoteEntry.js",
  // reportMfe: "http://localhost:5008/remoteEntry.js",
};
```

**Keunggulan runtime config vs build-time:**
- Ubah URL MFE → **tidak perlu rebuild shell**
- Di production/Kubernetes: cukup edit `env.js` atau inject via ConfigMap
- Pola ini mirip **Service Discovery Registry** di microservices

## Konvensi Port

| Port | Project | Package |
|------|---------|---------|
| **5000** | Shell (host) | `@template/shell` |
| 5001 | Reserved | — |
| 5002–5005 | Reserved (backend services) | — |
| **5006** | Child MFE 1 (default contoh) | `@template/mfe-child` |
| 5007 | Child MFE 2 | — |
| 5008 | Child MFE 3 | — |
| 5009 | Child MFE 4 | — |
| 5010 | Child MFE 5 | — |
| **5139** | Auth microservice | — |

## Skrip Lengkap

| Perintah | Deskripsi |
|----------|-----------|
| `pnpm install` | Install semua dependencies |
| `pnpm start` | `install` + `dev` — one command untuk setup baru |
| `pnpm dev` | Jalankan shell + child bersamaan (concurrently) |
| `pnpm dev:shell` | Hanya shell (port 5000) |
| `pnpm dev:child` | Hanya child MFE (port 5006) |
| `pnpm build` | Production build semua (urutan: shared → shell → child) |
| `pnpm build:shared` | Build shared library saja |
| `pnpm typecheck` | Type check semua packages (`pnpm -r typecheck`) |
| `pnpm clean` | Hapus `dist/`, `node_modules/`, `.webpack-cache/` |

**Windows:**
```powershell
.\start.ps1    # install + dev
```

**Linux/Mac:**
```bash
./start.sh     # install + dev
```

## pnpm dev — concurrently

```json
"dev": "concurrently --names \"shell,child\" --prefix-colors \"yellow,cyan\" 
  \"pnpm --filter @template/shell dev\" 
  \"pnpm --filter @template/mfe-child dev\""
```

Saat menambah MFE baru ke concurrently:
```json
"dev": "concurrently --names \"shell,admin,reports\" --prefix-colors \"yellow,cyan,magenta\"
  \"pnpm --filter @template/shell dev\"
  \"pnpm --filter @template/mfe-admin dev\"
  \"pnpm --filter @template/mfe-reports dev\""
```

## env.ts — Env Helpers di Shared Library

File: `template-shared/src/lib/env.ts`

```typescript
// Utility untuk read env variables dengan type safety
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = (window as any).__ENV__?.[key] ?? process.env[key] ?? defaultValue;
  if (!value) throw new Error(`Missing env variable: ${key}`);
  return value;
};
```

---
*Lanjut → [12. Panduan Migrasi](./12-panduan-migrasi-monolith-ke-mfe.md)*
