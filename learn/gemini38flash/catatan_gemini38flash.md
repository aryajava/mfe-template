# Buku Panduan Lengkap Micro-Frontend (MFE) — Gemini 3.8 Flash
> Koleksi catatan komprehensif arsitektur Micro-Frontend yang disusun khusus untuk programmer **Backend**.

Dokumen ini adalah **Index Utama**. Seluruh materi telah dipecah menjadi modul-modul terpisah yang terstruktur rapi di dalam folder [**`learn/gemini38flash/`**](file:///d:/Repositories/mfe-template/learn/gemini38flash) agar mudah dipelajari per topik.

---

## 📑 Daftar Modul Pembelajaran

1. [**01. Mental Model: Backend vs Browser**](./01-mental-model-backend-vs-browser.md)  
   *Perbedaan mendasar proses multi-kontainer Docker vs single-thread V8 Engine di satu tab browser.*

2. [**02. Peta Arsitektur & Peran Tiap Modul**](./02-peta-arsitektur-dan-peran-modul.md)  
   *Diagram alur dan pemisahan tanggung jawab antara `template-shell`, `template-mfe-child`, dan `@template/shared`.*

3. [**03. Webpack Module Federation Secara Mendalam**](./03-webpack-module-federation-mendalam.md)  
   *Anatomi `remoteEntry.js`, konfigurasi Plugin, serta rahasia `singleton: true` untuk mencegah error "Invalid Hook Call".*

4. [**04. Mekanisme Dynamic Loading (LazyMFE.tsx)**](./04-mekanisme-dynamic-loading-lazymfe.md)  
   *Bedah kode cara Shell menyuntikkan script dinamis, inisialisasi share scope, dan cache busting.*

5. [**05. Routing & Navigasi: SPA vs Nginx**](./05-routing-dan-navigasi-spa-vs-nginx.md)  
   *Bagaimana HTML5 History API (`pushState`) bekerja di memori tanpa reload halaman atau server reverse proxy.*

6. [**06. Komunikasi & State Management Decoupling**](./06-komunikasi-dan-state-management-mfe.md)  
   *Pola Pub/Sub EventBus (RabbitMQ/Kafka mini di browser) dan trik Standalone Mode pada `SharedContext`.*

7. [**07. Fault Tolerance: Circuit Breaker di Frontend**](./07-fault-tolerance-dan-circuit-breaker.md)  
   *Mencegah White Screen of Death saat Child MFE offline menggunakan `<MFEErrorBoundary>`.*

8. [**08. Masalah CSS Bleeding & Style Isolation**](./08-css-bleeding-dan-style-isolation.md)  
   *Mengapa CSS di browser bersifat global dan bagaimana Tailwind / CSS Modules melindunginya.*

9. [**09. Runtime Environment Config (env.js & 12-Factor App)**](./09-runtime-environment-config-envjs.md)  
   *Service Discovery Registry tanpa perlu me-rebuild image container di Kubernetes/Docker.*

10. [**10. Panduan Praktis Menambah Child MFE Baru**](./10-panduan-menambah-child-mfe-baru.md)  
    *6 langkah praktis mengekstrak fitur baru menjadi remote MFE independen.*

11. [**11. Cheat Sheet & Rangkuman Jebakan Ujian**](./11-cheat-sheet-dan-rangkuman-ujian.md)  
    *Daftar ringkas istilah kunci dan 5 jebakan klasik pemahaman bagi insinyur backend.*