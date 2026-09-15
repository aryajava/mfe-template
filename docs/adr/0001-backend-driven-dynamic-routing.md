# 0001. Backend-Driven Dynamic Route Registration

We replaced static route definitions and the `PermissionRoute` guard with Backend-Driven Dynamic Route Registration across the Shell and Remote MFEs. Previously, static routes exposed sub-paths (e.g., `/master/produk/tambah`) to any authenticated user who had read access, causing security vulnerabilities and requiring brittle path-matching logic. With dynamic registration, unauthorized routes are not mounted into the React Router tree, ensuring unauthorized direct URL navigation resolves directly to 404 (Not Found).

## Status

Accepted

## Considered Options

- **Option A: Static Routes + Route Guard (`PermissionRoute`)** (Rejected): Hardcoded path checks (`path.startsWith('/master/produk')`). Failed to protect sub-routes (`/tambah`, `/edit/:id`) from users with only read access, leaked route existence, and required ongoing manual updates in Shell whenever a new route was added.
- **Option B: Backend-Driven Dynamic Route Registration** (Chosen): The frontend route tree is assembled dynamically from the backend's `menuPermissions` grant. Routes are only mounted when `canRead`, `canCreate`, or `canUpdate` are granted. Direct address bar tampering on forbidden routes falls through naturally to `NotFound` (404).

## Consequences

- Direct URL access to unauthorized forms or pages produces `404 Not Found` rather than `403 Forbidden` (Principle of Inexistence / Least Privilege).
- `PermissionRoute.tsx` in `template-shell` is removed; routing authorization is decentralized to each respective remote MFE.
- Micro-frontends determine their internal route tree using `canAccessMenu` and `canPerformAction` provided by `SharedContext`.
