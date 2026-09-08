# Catatan Analisis mfe-template — Claude Sonnet 4.6 (Thinking)
> Koleksi catatan komprehensif arsitektur Micro-Frontend yang disusun dari hasil analisis mendalam.

Dokumen ini adalah **Index Utama**. Seluruh materi dipecah menjadi file-file terpisah per topik di dalam folder [learn/sonnet46thinking/](file:///d:/Repositories/mfe-template/learn/sonnet46thinking).

> **Model:** Claude Sonnet 4.6 (Thinking) | **Tanggal:** 2026-09-08 | **Repo:** ryajava/mfe-template

---

## 📑 Daftar Isi

1. [**01. Gambaran Umum & Tech Stack**](./01-gambaran-umum-dan-tech-stack.md)  
   *Teknologi, prasyarat, dan konteks penggunaan template MFE ini.*

2. [**02. Struktur Monorepo pnpm Workspaces**](./02-struktur-monorepo-pnpm-workspaces.md)  
   *Cara pnpm workspace mengelola 3 packages dan trick webpack alias tanpa build step.*

3. [**03. Arsitektur Module Federation**](./03-arsitektur-module-federation.md)  
   *Diagram Shell → Child → Shared, konsep Host vs Remote, dan dynamic loading.*

4. [**04. template-shell — Host App**](./04-template-shell-host-app.md)  
   *Provider stack, QueryClient config, AuthContext, dan cara menambah MFE baru ke route.*

5. [**05. template-mfe-child — Remote MFE**](./05-template-mfe-child-remote-mfe.md)  
   *Dual mode (standalone vs federated), pola Module.tsx, dan routing relatif.*

6. [**06. template-shared — Shared Library**](./06-template-shared-shared-library.md)  
   *Apa yang harus di-extract, struktur folder, dan barrel export pattern.*

7. [**07. Komunikasi Antar MFE (EventBus)**](./07-komunikasi-antar-mfe-eventbus.md)  
   *Pub/Sub pattern, MFE_EVENTS constants, dan cara pakai useEventBus hook.*

8. [**08. API Client (createApiClient)**](./08-api-client-createapiclient.md)  
   *Factory pattern, error handling built-in (401/403/204), dan TypeScript type.*

9. [**09. Utility Functions**](./09-utility-functions.md)  
   *cn(), formatDate, formatCurrency (IDR), debounce, throttle.*

10. [**10. Konfigurasi Webpack Module Federation**](./10-konfigurasi-webpack-module-federation.md)  
    *Shell vs Child config, eager singleton, alias shared library, optimasi build.*

11. [**11. Environment & Port Convention**](./11-environment-dan-port-convention.md)  
    *env.js runtime config, konvensi nomor port, dan skrip pnpm.*

12. [**12. Panduan Migrasi: Monolith → MFE**](./12-panduan-migrasi-monolith-ke-mfe.md)  
    *Kapan harus split, 6 langkah migrasi, checklist lengkap per MFE baru.*

13. [**13. Common Pitfalls & Solusinya**](./13-common-pitfalls-dan-solusinya.md)  
    *5 masalah klasik: duplikat React, CSS bleeding, MFE gagal load, auth, routing.*

14. [**14. Agent Skills & Tooling**](./14-agent-skills-dan-tooling.md)  
    *37 skills di .agents/skills/, GitHub issue tracker, domain docs protocol.*

15. [**15. Pola Penting & Insight**](./15-pola-penting-dan-insight.md)  
    *Async bootstrap pattern, SharedProvider auth propagation, LazyMFE dynamic loading.*
