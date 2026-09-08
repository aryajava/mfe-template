# 04. Mekanisme Dynamic Loading (LazyMFE.tsx)

Komponen [**`LazyMFE.tsx`**](file:///d:/Repositories/mfe-template/template-shell/src/components/LazyMFE.tsx) di dalam Shell adalah implementasi teknis dari pola **Dynamic Container Loader**.

---

## 1. Alur Kerja `LazyMFE` Langkah demi Langkah

```
User membuka rute /child
       │
       ▼
1. Cek Memory Cache (componentCache.get(cacheKey))
       ├── Jika ada di cache ──> Langsung render komponen
       └── Jika belum ada
             │
             ▼
2. Injeksi Elemen <script> ke document.head
   script.src = "http://localhost:5006/remoteEntry.js"
             │
             ▼
3. Tunggu Script Selesai Dimuat (script.onload)
   Browser sekarang memiliki objek global: window["childMFE"]
             │
             ▼
4. Inisialisasi Share Scope: container.init(shareScope)
   Sinkronisasi instance React dan React-DOM milik Shell ke Child
             │
             ▼
5. Unduh Modul: container.get("./Module")
             │
             ▼
6. Eksekusi Factory Function: const Module = factory()
             │
             ▼
7. Simpan di cache & Render di dalam <Suspense>
```

---

## 2. Bedah Kode Kunci (`LazyMFE.tsx`)

### A. Injeksi Script Tag Dinamis
```typescript
await new Promise<void>((resolve, reject) => {
  const script = document.createElement('script');
  script.src = url; // misal: http://localhost:5006/remoteEntry.js
  script.type = 'text/javascript';
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error(`Failed to load remote entry for ${scope} from ${url}`));
  document.head.appendChild(script);
});
```

### B. Inisialisasi Scope Berbagi Library
```typescript
const container = (window as any)[scope];
if (!container._initialized) {
  const shareScope = (window as any).__webpack_share_scopes__?.default;
  if (!shareScope['react'] || !shareScope['react-dom']) {
    throw new Error('Required React dependencies not shared');
  }
  await container.init(shareScope);
  container._initialized = true;
}
```

### C. Cache Invalidation di Development
```typescript
const versionedUrl = (() => {
  if (isDev) {
    const timestamp = Date.now();
    return url.includes('?') ? `${url}&_t=${timestamp}` : `${url}?_t=${timestamp}`;
  } else if (version) {
    return url.includes('?') ? `${url}&v=${version}` : `${url}?v=${version}`;
  }
  return url;
})();
```
Pada mode development (`localhost`), URL remote selalu ditambahkan query string timestamp (`?_t=...`) untuk mematikan caching browser sehingga perubahan kode di Child MFE langsung tercermin.