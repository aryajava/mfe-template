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

**MFE Module**:
A physical, independently deployed Webpack Module Federation remote container exposing an entry point (`scope`, `module`, `url`).

**Menu Group**:
A logical business navigation container defined in the backend/database (`groupCode`, `groupName`, `urlPrefix`, and `mfeKey`) representing a section in the sidebar.

**MfeKey**:
An abstract identifier assigned to a `Menu Group` by the backend to map it to an `MFE Module` in the Shell's catalog. Decouples physical MFE deployments from logical menu groups, enabling 1-to-many relationships (e.g. one `mfe-report` serving both `/report` and `/cetak` groups).

**Menu Icon Identifier**:
A canonical Lucide icon identifier string (e.g. `Package`, `ShoppingBag`, `Database`, `Settings`) stored in `MASTER_MENU.ICON` and `MASTER_MENU_GROUP.ICON`, delivered via `/role-menus/my-permissions`, and resolved dynamically by the frontend shell with fallback to `Box` (menu item) or `Layers` (menu group).
_Avoid_: Material icon, material glyph, icon asset path.

**DataTable**:
The standardized, deep tabular UI module provided by `template-shared` encapsulating server-side pagination math, sortable headers, responsive container, loading spinners, empty states, and footer navigation behind declarative column configurations with cell and row render escape hatches.
_Avoid_: Table wrapper, grid container, raw table markup.

