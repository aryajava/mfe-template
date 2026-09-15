# Spesifikasi: Implementasi Master Kategori dan Master Ekspedisi

## Problem Statement

Pengurus Toko saat ini belum dapat mengelola data klasifikasi kategori produk dan opsi layanan ekspedisi pengiriman secara mandiri melalui antarmuka Microfrontend (`mfe-master`). Modul `mfe-master` baru menyediakan pengelolaan Master Produk, sementara kartu Master Kategori dan Master Ekspedisi pada Master Hub masih berstatus nonaktif. 

Selain itu, kontrak API backend pada controller kategori dan ekspedisi belum simetris dengan Master Produk terkait operasi pengalihan status operasional (*toggle status*), dan penghapusan data belum memiliki proteksi integritas transaksi yang konsisten (pencegahan *hard delete* untuk entitas yang masih memiliki relasi aktif pada katalog atau riwayat pesanan pelanggan). Terakhir, pembatasan hak akses peran antara Admin Toko, Pemilik Toko, dan Super Admin belum ditegakkan secara menyeluruh pada navigasi dan rute Microfrontend.

## Solution

Mengimplementasikan modul **Master Kategori** dan **Master Ekspedisi** secara penuh pada aplikasi Microfrontend `mfe-master` dan `template-shell` dengan arsitektur sub-rute terpisah, dilengkapi penyeragaman kontrak API status operasional di backend, proteksi transaksi ketat terhadap penghapusan permanen, dan pertahanan hak akses berlapis (*defense-in-depth* 403) sesuai dokumen keputusan arsitektur (ADR 0006) dan glosarium domain `CONTEXT.md`.

## User Stories

1. As a Pemilik Toko, I want to view a paginated list of categories with sorting and search, so that I can monitor and locate product categories quickly.
2. As an Admin Toko, I want to view the category catalog, so that I understand how products are classified in the store.
3. As an Admin Toko, I want to create a new category via a dedicated form, so that products can be assigned to appropriate classifications.
4. As an Admin Toko, I want the system to reject duplicate category names, so that product classifications remain distinct and unambiguous.
5. As an Admin Toko, I want to update an existing category name, so that naming mistakes or rebranding can be corrected.
6. As an Admin Toko, I want optimistic concurrency protection during category updates, so that changes do not overwrite edits made simultaneously by other staff.
7. As a Pemilik Toko, I want to toggle a category's operational status between Aktif and Nonaktif, so that I can control whether that category appears in public storefront filters without deleting its data.
8. As a Pemilik Toko, I want the system to prevent permanent deletion of any category that still has associated products, so that product catalog integrity is preserved.
9. As a Pemilik Toko, I want to see an informative modal warning when trying to delete a category with existing products, so that I understand why deletion is blocked and can deactivate it instead.
10. As a Pemilik Toko, I want to permanently delete a newly created category that has zero associated products, so that accidental or unused entries can be cleaned from the database.
11. As a Super Admin (SA), I want full authority to create, update, toggle status, and delete categories, so that I can administer system data without restriction.
12. As a Pemilik Toko, I want to view a paginated list of expeditions with shipping fees, search, and sorting, so that I can manage available shipping options.
13. As a Super Admin (SA), I want to view and manage all expedition data, so that shipping configurations can be maintained.
14. As a Pemilik Toko, I want to register a new expedition with its name and shipping fee formatted in Rupiah, so that customers can choose it during checkout.
15. As a Pemilik Toko, I want to update an expedition's name and shipping fee with concurrency protection, so that delivery pricing remains accurate and conflicts are detected.
16. As a Pemilik Toko, I want to toggle an expedition's status between Aktif and Nonaktif, so that I can suspend an unavailable delivery service without breaking historical order data.
17. As a Pemilik Toko, I want the system to block permanent deletion of an expedition if it has ever been used in customer orders, so that past order records and receipts remain completely intact.
18. As a Pemilik Toko, I want to permanently delete an expedition that has never been used in any customer order, so that test or obsolete entries can be removed.
19. As an Admin Toko, I want the Master Ekspedisi navigation links in the sidebar and Master Hub to be hidden from my view, so that I am not exposed to administrative settings outside my role.
20. As an Admin Toko, I want to see a clear 403 Forbidden page with a return button if I attempt to access expedition URLs directly, so that I understand I lack permission without encountering application crashes.
21. As an Pengurus Toko, I want all deletion and status change actions to require confirmation via an accessible, internal modal dialog, so that accidental clicks are prevented without relying on crude browser alert dialogs.
22. As an Pengurus Toko, I want all master screens to adhere to a clean, anti-slop design system with WCAG AA contrast and Indonesian terminology, so that the back-office environment feels professional and cohesive.

## Implementation Decisions

- **Architectural Shape**:
  - The feature spans two applications: backend monolith (`cobaproject`) and frontend microfrontend (`mfe-template`).
  - Frontend modules are encapsulated in `mfe-master` (domain pages and API service adapters) and mounted into `template-shell` via Webpack Module Federation.
- **Microfrontend Sub-Routes**:
  - Standard multi-route pattern matching Master Produk:
    - Kategori: `/master/kategori` (table list), `/master/kategori/tambah` (create form), `/master/kategori/edit/:id` (edit form).
    - Ekspedisi: `/master/ekspedisi` (table list), `/master/ekspedisi/tambah` (create form), `/master/ekspedisi/edit/:id` (edit form).
- **Backend API Symmetry**:
  - Endpoint `POST /api/categories/{id}/status` and `POST /api/couriers/{id}/status` added, accepting `{ isActive: boolean }`.
  - Both endpoints authorized under dynamic role policies: `Menu:master-kategori:status` and `Menu:master-ekspedisi:status` (evaluating `CAN_TOGGLE_ACTIVE`).
- **Relational Protection Rules**:
  - `DELETE /api/categories/{id}`: checks whether products exist for the category. If products exist, returns a validation error guiding the user to deactivate instead. Hard deletes only if product count is zero.
  - `DELETE /api/couriers/{id}`: checks whether the courier is referenced in `LOSCONSUMER.TRX_ORDER`. If referenced, returns a validation error guiding the user to deactivate instead. Hard deletes only if no order references exist.
- **Role-Based Authorization & Defense-in-Depth (403)**:
  - Permissions are fetched dynamically on page load from `/api/role-menus/my-permissions` and evaluated per menu code (`master-kategori` vs `master-ekspedisi`).
  - Shell sidebar conditionally renders the Master Ekspedisi navigation item based on active permissions.
  - Master Hub card for Ekspedisi dynamically adjusts visibility or access state based on permissions.
  - Route guard component (`PermissionGuard`) wraps `/master/ekspedisi/*` in `mfe-master`, rendering an in-place 403 Forbidden alert view when unauthorized.
- **Strict Domain Vocabulary**:
  - All UI copy must strictly use "Ekspedisi". Words such as "kurir", "jasa kirim", "shipping", and "courier" are forbidden in user-facing text.
  - Roles must strictly display "Super Admin (SA)", "Pemilik Toko", and "Admin Toko".
  - Monetary values must format strictly with the Indonesian Rupiah standard (`Rp xx.xxx`).

## Testing Decisions

- **Definition of a Good Test**:
  - Tests must verify external behavior through observable user interactions and responses, never internal component state or private helper methods.
  - Tests should execute against the highest realistic seam to maximize regression protection and refactoring flexibility.
- **Seams for Testing**:
  - **Primary Frontend Seam (Highest Seam)**: The Page Component Level (`KategoriIndex`, `KategoriTambah`, `KategoriUbah`, `EkspedisiIndex`, `EkspedisiTambah`, `EkspedisiUbah`) rendered with MemoryRouter and mock AuthContext / HTTP fetch handler. Tests interact by clicking buttons, typing into fields, and asserting rendered tables, modals, and error banners.
  - **Secondary Frontend Seam**: Service Adapter modules (`categoryApi`, `courierApi`) testing request construction (`X-Api-Key`, query parameters, JSON payload) and error handling.
  - **Backend Controller Seam**: HTTP endpoint integration tests verifying status code outputs (200, 400, 403, 404, 409), optimistic concurrency conflict detection, and relational integrity rejection.
- **Prior Art**:
  - Master Produk test patterns in `mfe-master/src/pages/Produk/` and `productApi.ts`.
  - Backend controller tests for `ProductsController` and `RoleMenuController`.

## Out of Scope

- Implementing customer-facing checkout courier selection changes (already present in Razor Pages / checkout flow).
- Multi-tier nested category trees (parent-child category hierarchy). Categories remain flat single-level classifications.
- Weight/distance-based dynamic shipping tariff calculators. Shipping fee remains a fixed fee per expedition.
- Batch import/export of categories and expeditions via Excel/CSV.

## Further Notes

- Aligns directly with ADR 0006: `0006-standarisasi-status-dan-proteksi-kategori-ekspedisi.md`.
- Concurrency control utilizes the existing `VERSION` column on `MASTER_CATEGORY` and `MASTER_COURIER`.
