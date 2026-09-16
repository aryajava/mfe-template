# 0003. Backend-Driven Lucide Icons Standardization

We standardize menu and group navigation icons on canonical `lucide-react` identifiers stored in the backend and delivered via permissions API. Previously, database seed records contained Google Material Icons identifiers (e.g. `inventory_2`, `receipt_long`, `admin_panel_settings`), while the frontend Shell layout relied on hardcoded static icon mappings. Unmapped or missing icons now resolve dynamically with deterministic fallbacks to `Box` (menu items) and `Layers` (menu groups).

## Status

Accepted

## Decision

1. **Database & API Standardization**:
   - `MASTER_MENU.ICON` and `MASTER_MENU_GROUP.ICON` store canonical Lucide icon names in PascalCase (e.g. `Package`, `Database`, `ShoppingBag`, `Settings`).
   - Migration script `Script0040_MigrateIconsToLucide.sql` migrates all legacy Material Icons entries in SQL Server to their Lucide equivalents.
   - `GET /role-menus/my-permissions` delivers `Icon` and `GroupIcon` in the `MenuPermissionDto` response payload.

2. **Frontend Dynamic Resolution**:
   - `template-shell` dynamically resolves the icon string using a case-insensitive, normalized Lucide lookup (`resolveLucideIcon`).
   - Static dictionary mappings (`MENU_ICONS` and `GROUP_ICONS`) in `Layout.tsx` are removed.
   - Deterministic fallbacks:
     - Menu items: `Box` (or `Home` for dashboard if unspecified).
     - Menu groups: `Layers`.

3. **Maintenance UI Alignment**:
   - `mfe-maintain` displays live Lucide icon previews and sets default icon identifiers to `Box` (menu) and `Layers` (group).

## Considered Options

- **Option A: Full Lucide Standardization + Dynamic Resolver** (Chosen): Clean, zero external font overhead, aligns with the existing Tailwind/Lucide design system, and allows new menus created by admins to immediately display correct icons.
- **Option B: Dual-Library Support (Lucide + Material Icons Web Font)** (Rejected): Introduces Google Fonts network dependency, inconsistent icon weights and styling, and increases bundle size.
- **Option C: Frontend Hardcoded Mapping Table** (Rejected): Requires frontend redeployments every time a new menu or group is created in the database.

## Consequences

- Consistent, sharp visual styling across all navigation elements.
- No network requests for external web fonts.
- Menus with typo or invalid icon names safely degrade to `Box` / `Layers` without throwing React runtime errors.
