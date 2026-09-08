# 03. Arsitektur Module Federation
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Diagram Arsitektur

```
┌──────────────────────────── SHELL (Host) :5000 ─────────────────────────┐
│                                                                          │
│   ┌──────────┐  ┌───────────┐  ┌─────────────────────────────────────┐  │
│   │  Login   │  │ Dashboard │  │         LazyMFE Loader              │  │
│   └──────────┘  └───────────┘  └────────────────┬────────────────────┘  │
│                                                  │                      │
│   ┌──────────────────────────────────────────────┴──────────────────┐   │
│   │              Layout (Sidebar + TopBar)                          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                               │ loads via remoteEntry.js (runtime)
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Child MFE A    │  │  Child MFE B    │  │  Child MFE C    │
│  :5006          │  │  :5007          │  │  :5008          │
│  scope: adminMFE│  │  scope: rptMFE  │  │  scope: wfMFE   │
│  exposes:Module │  │  exposes:Module │  │  exposes:Module │
└────────┬────────┘  └───────┬─────────┘  └───────┬─────────┘
         └──────────────────┴────────────────────┘
                              │
              ┌───────────────┴────────────────┐
              │        @template/shared        │
              │  components, hooks,            │
              │  contexts, utils, api          │
              └────────────────────────────────┘
```

## Konsep Kunci

### Shell = Host
- Tidak tahu **implementasi** child MFE
- Hanya tahu **URL** `remoteEntry.js` child
- Menyediakan: Login, Layout, routing global, auth context
- Mengelola shared dependencies sebagai singleton

### Child MFE = Remote
- Expose satu entry point `./Module` via Module Federation
- Bekerja dalam dua mode: **standalone** dan **federated**
- Tidak boleh duplikat shared deps (React, React Router)

### Shared Library
- Di-share sebagai **singleton** — satu instance digunakan semua MFE
- Tidak pernah punya duplicate; error jika ada dua versi berbeda

## Alur Loading (Runtime)

```
User buka /admin/users
    │
    ▼
Shell routes.tsx: path="/admin/*" → <LazyMFE scope="adminMFE" url="...5006..." />
    │
    ▼
LazyMFE inject <script src="http://localhost:5006/remoteEntry.js">
    │
    ▼
remoteEntry.js dimuat → expose window.adminMFE
    │
    ▼
window.adminMFE.get('./Module') → React component
    │
    ▼
React.lazy + Suspense → render Module.tsx dari child MFE
```

**Key insight:** URL remote bisa diubah **tanpa rebuild shell**. Ini adalah keunggulan utama Module Federation dibanding static bundling.

## Dua Cara Expose Module Federation

### Static (build-time)
```javascript
// webpack.config shell
remotes: {
  adminMFE: 'adminMFE@http://localhost:5006/remoteEntry.js',
}
// import AdminModule from 'adminMFE/Module'
```

### Dynamic (runtime) — digunakan template ini
```javascript
// webpack.config shell
remotes: {}  // kosong!
// LazyMFE load via script injection + window[scope].get(module)
```

Template menggunakan **dynamic** agar URL bisa dikonfigurasi via `env.js` tanpa rebuild.

## Shared Dependencies — Singleton Pattern

```javascript
// WAJIB di semua MFE
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  'react-router-dom': { singleton: true },
}
```

- `singleton: true` → hanya satu instance, semua MFE pakai yang sama
- Tanpa ini → duplikat React → "Invalid Hook Call" error
- `eager: true` → hanya di shell, agar tidak async saat bootstrap

---
*Lanjut → [04. template-shell Host App](./04-template-shell-host-app.md)*
