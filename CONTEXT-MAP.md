# Context Map

## Contexts

- [Template Shell](./template-shell/): Host application managing root layout, authentication session, navigation sidebar, and micro-frontend orchestration.
- [Template Shared](./template-shared/): Shared contracts, event bus, cross-cutting contexts, and reusable UI components.
- [Master MFE](./mfe-master/): Master data domain handling catalog and administration entities (Produk, Kategori, Ekspedisi, Pelanggan, and User).
- [Hallo MFE](./mfe-hallo/): Example communication and cross-MFE interaction remote.
- [Child MFE](./template-mfe-child/): Starter template for new remote micro-frontends.

## Relationships

- **Template Shell → Master MFE**: Shell mounts Master MFE dynamically under `/master/*` and propagates `SharedContext` (`authContext`, `queryClient`, `eventBus`).
- **Template Shared ↔ All MFEs**: Common contract definition for `User`, `MenuPermissionItem`, `AuthContextType`, and shared UI primitives.

## Ubiquitous Language

**Menu Permission**:
A granular authorization grant delivered by the backend for a specific menu entity, defining `canRead`, `canCreate`, `canUpdate`, `canDelete`, and `canToggleActive`.
_Avoid_: Role capability, menu privilege.

**Dynamic Route Registration**:
The architectural pattern where client-side route nodes (`<Route>`) are mounted into the React Router tree strictly when authorized by backend permission grants, causing unauthorized URLs to naturally resolve to 404 (Not Found).
_Avoid_: Route guard, route interceptor, protected route wrapper.

**Component Registry**:
A catalog or mapping between domain feature identifiers and their respective React components.
