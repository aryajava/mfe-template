# 09. Runtime Environment Config (env.js & 12-Factor App)

Di arsitektur backend, prinsip **12-Factor App** menyatakan bahwa konfigurasi harus dipisahkan secara ketat dari kode program (biasanya via OS Environment Variables).

---

## 1. Masalah Pendekatan Tradisional (`.env`) di Frontend

Kebanyakan framework frontend menyuntikkan variabel environment saat **waktu kompilasi (build-time)**:
```javascript
// Diproses saat build webpack
const API_URL = process.env.REACT_APP_API_URL;
```
### Kelemahan Fatal:
Nilai string tersebut langsung di-hardcode ke dalam file bundle `.js`. Jika Anda ingin memindahkan image Docker dari server Staging ke Production, Anda terpaksa harus **me-rebuild image container** tersebut dari awal hanya untuk mengganti URL backend.

---

## 2. Solusi Modern di Repo Ini: `template-shell/env.js`

Perhatikan implementasi di [**`template-shell/env.js`**](file:///d:/Repositories/mfe-template/template-shell/env.js):

```javascript
(function () {
  const _actualEnv = {
    MODE: "local",
    API_BASE_URL: "http://localhost:5139/api",
    MFE_ROUTES: {
      childMfe: "http://localhost:5006/remoteEntry.js",
    },
    getApiUrl(serviceName) { ... },
    getMfeUrl(mfeName) { ... },
  };

  // Pasang di window global sebagai properti read-only
  Object.defineProperty(window, '_env', {
    get() { return _actualEnv; }
  });

  Object.freeze(window._env); // Kunci agar aman dari mutasi
})();
```

### Keunggulan di Production:
- File `env.js` dimuat secara terpisah lewat tag script di `index.html`: `<script src="/env.js"></script>`.
- Di lingkungan Kubernetes / Docker, Anda cukup meng-inject file `env.js` ini menggunakan **ConfigMap / Volume Mount**.
- Container Docker di-build satu kali, dan dapat dideploy ke Development, Staging, maupun Production tanpa perlu re-compile. File ini bertindak sebagai **Service Discovery Registry Table**.