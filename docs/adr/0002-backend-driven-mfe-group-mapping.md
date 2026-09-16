# 0002. Backend-Driven MFE Group Mapping via MfeKey

We decouple physical Remote Micro-Frontends (`MFE Module`) from business navigation groups (`Menu Group`) by introducing an abstract `mfeKey` on `MenuGroup` in the backend. Previously, the Shell assumed a 1:1:1 mapping (`groupCode === mfeKey === urlPrefix`), requiring brittle static alias routes (e.g. `/transaksi/*`, `/operasional/*`, `/monitoring/*`, `/laporan/*`, `/maintenance/*`, `/pengaturan/*`) and preventing a single MFE (like `mfe-report`) from serving multiple distinct menu groups (such as `/report` and `/cetak`).

## Status

Accepted

## Decision

1. **Backend MfeKey Assignment**:
   - `MasterMenuGroup` in database stores an `MfeKey` (e.g. `"report"`, `"master"`, `"trx"`).
   - Backend APIs (`/api/menu-groups` and `/role-menus/my-permissions`) include `mfeKey` in their payloads.
   - Backend remains completely unaware of physical frontend bundle locations (ports, Webpack scopes, script URLs).

2. **Frontend Shell Catalog & Dynamic Mount**:
   - `template-shell` maintains an `MFE_CATALOG` mapping `mfeKey` to physical module federation metadata (`scope`, `module`, `url`).
   - Routes are generated purely dynamically from authorized menu groups:
     `<Route path={`${group.urlPrefix}/*`} element={<LazyMFE {...catalog[group.mfeKey]} basePath={group.urlPrefix} />} />`.
   - All static alias routes in `routes.tsx` are completely eliminated.

3. **Strict Null Fallback**:
   - If a menu group has an empty or null `mfeKey`, or if the specified `mfeKey` is not found in the Shell's catalog, the Shell does not guess or fallback to `groupCode`. Instead, it renders `ModulePlaceholder` indicating that the module is under development.

4. **Multi-Group MFE Routing**:
   - Remote MFEs serving multiple groups (e.g. `mfe-report`) receive the dynamic `basePath` from `LazyMFE` and resolve sub-routes relatively or namespace them based on the active base path.

## Considered Options

- **Option A: Backend-Driven MfeKey + Shell Local Catalog** (Chosen): Clean separation of concerns. The backend owns business groupings and domain assignments; the frontend owns asset deployment and environment-specific bundle URLs.
- **Option B: Full Backend MFE Registry in Database** (Rejected): Storing `remoteEntry.js` URLs, Webpack scopes, and ports in the database couples the database to frontend hosting infrastructure and creates high operational friction across local dev, staging, and CDN environments.
- **Option C: Frontend-Only Static Aliasing** (Rejected): Hardcoding routes in `routes.tsx` breaks runtime dynamicity, causes naming mismatches, and forces Shell redeployments for new menu groups.

## Consequences

- Zero hardcoded alias routes in `routes.tsx`.
- 1-to-many capability: a single MFE container (e.g. `mfe-report`) can seamlessly host multiple business menu groups (`/report`, `/cetak`).
- New menu groups created in the backend can immediately mount to existing MFEs without touching Shell routing code.
- Existing database menu groups must be seeded with their appropriate `MfeKey` to avoid falling into `ModulePlaceholder`.
