# 0004. Standardized DataTable Component in `@template/shared`

We standardize all table layouts across micro-frontend remotes onto a shared, deep module `<DataTable />` in `@template/shared`. Previously, each MFE implemented its own table DOM, row calculation math, loading spinners, empty states, and pagination footers (~80-120 lines of repetitive boilerplate per page), resulting in subtle UI inconsistencies (e.g. mismatched footer wording, inconsistent page-size dropdowns, and divergent empty-state handling).

## Status

Accepted

## Decision

1. **Deep Module Placement (`template-shared`)**:
   - Create `<DataTable />` and its companion primitive `<TablePagination />` under `template-shared/src/components/ui/data-table.tsx`.
   - Export both components and their TypeScript contracts (`DataTableColumn`, `DataTableProps`, `TablePaginationProps`) through the `@template/shared` root barrel.

2. **Strict Pagination Interface**:
   - Enforce `pagination: PaginationConfig` (`{ page: number; pageSize: number; total: number }`) across all caller MFEs.
   - Refactor disparate flat states (`page`, `pageSize`, `totalCount`) across all MFEs to standard `PaginationConfig`.

3. **Hybrid Extensibility (Cell Renderer + Full Row Escape Hatch)**:
   - **Cell Renderer (`render`)**: Columns declare `render?: (value: any, record: T, index: number) => React.ReactNode` for custom badges, thumbnails, actions, and formatting.
   - **Row Escape Hatch (`renderRow`)**: Callers with complex row structures (e.g. nested accordions or sub-rows) can pass `renderRow?: (record: T, index: number) => React.ReactNode` to take over `<tr>` rendering while keeping headers, loading states, and pagination intact.

4. **Built-in Implementation Invariants**:
   - **Loading State**: Automatically renders a centered `<LoadingSpinner />` across a dynamic `colSpan`.
   - **Empty State**: Automatically renders friendly fallback text and empty-state messaging when `data.length === 0`.
   - **Sortable Headers**: Automatically attaches sort click handlers, toggles `asc` / `desc`, and highlights `ArrowUpDown` active states.
   - **Pagination Footer**: Automatically renders row selector `[5, 10, 20, 50, 100]`, "Menampilkan X sampai Y dari Z <itemLabel>", and sliding-window numbered page buttons.

## Considered Options

- **Option A: Full-Featured Deep DataTable with Escape Hatches** (Chosen): Maximizes leverage for callers (writing 10 lines of declarative columns instead of 100 lines of table DOM) and ensures 100% UI consistency, while preserving flexibility via cell and row renderers.
- **Option B: Footer-Only Standardization (`TablePagination` only)** (Rejected): Still leaves ~60 lines of table markup, column header loops, loading spinners, and empty states duplicated across every MFE page.
- **Option C: Rigid Monolith without Render Props** (Rejected): Would break complex pages (actions menu, password reset, dynamic role modal triggers) or force shallow pass-through props.

## Consequences

- Callers in `mfe-master`, `mfe-trx`, `mfe-maintain`, and `mfe-monitor` write concise, declarative table configurations.
- Design improvements or accessibility fixes in table layouts are made in `template-shared` once and immediately benefit all micro-frontends.
- Consistent user experience (typography, hover states, sort buttons, page navigation) across all modules in the host shell.
