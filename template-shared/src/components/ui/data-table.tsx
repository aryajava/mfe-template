import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { PaginationConfig, SortConfig } from '../../types/common';

/**
 * Konfigurasi kolom untuk DataTable
 */
export interface DataTableColumn<T> {
  /** Identifier unik kolom (bisa mencocokkan field record atau custom seperti 'actions') */
  key: string;
  /** Label header kolom (string atau ReactNode) */
  label: React.ReactNode;
  /** Apakah kolom dapat diurutkan (sortable) */
  sortable?: boolean;
  /** Kunci pengurutan ke backend jika berbeda dari `key` */
  sortKey?: string;
  /** Perataan teks: 'left' (default) | 'center' | 'right' */
  align?: 'left' | 'center' | 'right';
  /** Lebar kolom (misal: 'w-14', '120px', 'min-w-[200px]') */
  width?: string;
  /** Class styling tambahan untuk <td> */
  className?: string;
  /** Class styling tambahan untuk <th> */
  headerClassName?: string;
  /** Custom cell renderer function */
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

/**
 * Props untuk komponen TablePagination (Footer)
 */
export interface TablePaginationProps {
  /** Objek konfigurasi paginasi: { page, pageSize, total } */
  pagination: PaginationConfig;
  /** Handler saat halaman atau ukuran halaman berubah */
  onPaginationChange: (pagination: PaginationConfig) => void;
  /** Nama entitas data (default: "data", misal: "produk", "pesanan", "user") */
  itemLabel?: string;
  /** Pilihan jumlah baris per halaman (default: [5, 10, 20, 50, 100]) */
  pageSizeOptions?: number[];
  /** Apakah sedang dalam proses loading */
  isLoading?: boolean;
  /** Class styling container */
  className?: string;
  /** Custom active color class untuk tombol halaman aktif (default: 'bg-orange-600 text-white font-bold hover:bg-orange-700') */
  activeColorClassName?: string;
}

/**
 * Menghasilkan array segmen paginasi (nomor halaman dan ellipsis)
 * mengikuti standar desain "BORDERED SEGMENTS" (Image 2).
 * Jika total halaman > 5, elipsis '...' selalu dimunculkan untuk memangkas rentang.
 * Bebas dari bug duplikasi angka pada batas halaman.
 */
export function getPaginationSegments(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 1) return [1];

  // Hanya jika total halaman <= 5, tampilkan seluruh nomor halaman tanpa elipsis
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Khusus totalPages = 6: elipsis selalu muncul memangkas halaman yang tidak aktif
  if (totalPages === 6) {
    if (page <= 3) {
      return [1, 2, 3, 4, '...', 6];
    } else {
      return [1, '...', 3, 4, 5, 6];
    }
  }

  // Jika totalPages >= 7:
  // 1. Dekat awal (page <= 4): [1, 2, 3, 4, 5, '...', totalPages] (persis Gambar 2)
  if (page <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  // 2. Dekat akhir (page >= totalPages - 3): [1, '...', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages]
  if (page >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // 3. Di tengah: [1, '...', page-1, page, page+1, '...', totalPages]
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
}

/**
 * TablePagination
 * Komponen footer terstandarisasi untuk navigasi paginasi dan selector baris.
 */
export const TablePagination: React.FC<TablePaginationProps> = ({
  pagination,
  onPaginationChange,
  itemLabel = 'data',
  pageSizeOptions = [5, 10, 20, 50, 100],
  isLoading = false,
  className,
  activeColorClassName = 'bg-orange-600 text-white font-bold hover:bg-orange-700',
}) => {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    onPaginationChange({ ...pagination, page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    onPaginationChange({
      ...pagination,
      pageSize: newSize,
      page: 1, // Reset ke halaman 1 saat pageSize berubah
    });
  };

  const paginationSegments = getPaginationSegments(page, totalPages);

  return (
    <div
      className={cn(
        'py-3 px-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Selector Jumlah Baris per Halaman */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-7 px-2 py-0 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 font-medium cursor-pointer"
            aria-label="Pilih jumlah baris per halaman"
            disabled={isLoading}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / hal
              </option>
            ))}
          </select>
        </div>

        {/* Indikator Rentang Data */}
        <div>
          Menampilkan{' '}
          <span className="font-semibold text-gray-900 tabular-nums">
            {startRecord}
          </span>{' '}
          sampai{' '}
          <span className="font-semibold text-gray-900 tabular-nums">
            {endRecord}
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-gray-900 tabular-nums">
            {total}
          </span>{' '}
          {itemLabel}
        </div>
      </div>

      {/* Navigasi Nomor Halaman - Bordered Segments (Image 2) */}
      {totalPages > 1 && (
        <nav
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-2xs divide-x divide-gray-200 overflow-hidden select-none"
          aria-label="Navigasi Halaman"
        >
          {/* Tombol Sebelumnya (<) */}
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="h-8 w-8 inline-flex items-center justify-center text-gray-500 hover:bg-orange-50/60 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors cursor-pointer"
            aria-label="Halaman sebelumnya"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Segmen Angka & Ellipsis */}
          {paginationSegments.map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 min-w-[34px] px-2 inline-flex items-center justify-center text-xs font-semibold text-gray-400 bg-gray-50/40 select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = page === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handlePageChange(item)}
                disabled={isLoading}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-[34px] px-2.5 inline-flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer',
                  isActive
                    ? activeColorClassName
                    : 'text-gray-700 hover:bg-orange-50/60 hover:text-orange-600'
                )}
              >
                {item}
              </button>
            );
          })}

          {/* Tombol Selanjutnya (>) */}
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="h-8 w-8 inline-flex items-center justify-center text-gray-500 hover:bg-orange-50/60 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors cursor-pointer"
            aria-label="Halaman selanjutnya"
            title="Halaman selanjutnya"
          >
            <ChevronRight className="w-4 h-4 stroke-[2]" />
          </button>
        </nav>
      )}
    </div>
  );
};

/**
 * Props untuk komponen DataTable
 */
export interface DataTableProps<T> {
  /** Array baris data */
  data: T[];
  /** Konfigurasi kolom */
  columns: DataTableColumn<T>[];
  /** Konfigurasi paginasi (opsional jika tabel tanpa paginasi) */
  pagination?: PaginationConfig;
  /** Handler saat paginasi berubah */
  onPaginationChange?: (pagination: PaginationConfig) => void;
  /** State pengurutan aktif (opsional) */
  sortConfig?: SortConfig;
  /** Handler saat pengurutan berubah */
  onSortChange?: (sortConfig: SortConfig) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Nama entitas data untuk label footer (default: 'data') */
  itemLabel?: string;
  /** Pesan kustom saat data kosong */
  emptyMessage?: React.ReactNode;
  /** Deskripsi kustom saat data kosong */
  emptyDescription?: React.ReactNode;
  /** Pilihan opsi pageSize (default: [5, 10, 20, 50, 100]) */
  pageSizeOptions?: number[];
  /** Fungsi untuk menentukan unique key setiap baris (default: record.id || index) */
  rowKey?: (record: T, index: number) => string | number;
  /** Fungsi untuk menambahkan class kustom pada baris <tr> */
  rowClassName?: (record: T, index: number) => string | undefined;
  /** Handler saat baris diklik */
  onRowClick?: (record: T, index: number) => void;
  /** Escape Hatch: Override render baris penuh <tr> */
  renderRow?: (record: T, index: number) => React.ReactNode;
  /** Class container pembungkus terluar */
  className?: string;
  /** Class elemen <table> */
  tableClassName?: string;
  /** Sembunyikan footer paginasi */
  hidePagination?: boolean;
  /** Custom active color class untuk tombol halaman aktif (default: 'bg-orange-600 text-white font-bold hover:bg-orange-700') */
  paginationActiveColorClassName?: string;
}

/**
 * DataTable
 * Komponen deep module terpadu untuk penyajian data tabular di seluruh MFE.
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPaginationChange,
  sortConfig,
  onSortChange,
  isLoading = false,
  itemLabel = 'data',
  emptyMessage = 'Tidak ada data ditemukan',
  emptyDescription = 'Belum ada data yang tersedia atau coba sesuaikan kata kunci pencarian Anda.',
  pageSizeOptions = [5, 10, 20, 50, 100],
  rowKey,
  rowClassName,
  onRowClick,
  renderRow,
  className,
  tableClassName,
  hidePagination = false,
  paginationActiveColorClassName,
}: DataTableProps<T>) {
  const handleSortClick = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;
    const targetKey = column.sortKey || column.key;

    let nextDirection: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === targetKey) {
      nextDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    onSortChange({
      key: targetKey,
      direction: nextDirection,
    });
  };

  const getRowKey = (record: T, index: number): string | number => {
    if (rowKey) return rowKey(record, index);
    if ('id' in record && record.id != null) return record.id;
    return index;
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden transition-all duration-200',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className={cn('w-full text-left text-xs text-gray-600', tableClassName)}>
          <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col) => {
                const targetKey = col.sortKey || col.key;
                const isSorted = sortConfig?.key === targetKey;
                const isSortable = !!col.sortable && !!onSortChange;

                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && handleSortClick(col)}
                    className={cn(
                      'py-3.5 px-4 whitespace-nowrap select-none',
                      col.width,
                      getAlignmentClass(col.align),
                      isSortable &&
                        'cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors',
                      col.headerClassName
                    )}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{col.label}</span>
                      {isSortable && (
                        <span className="inline-flex">
                          {isSorted ? (
                            sortConfig?.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-orange-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-orange-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <LoadingSpinner size="md" />
                    <span className="text-xs text-gray-500 font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{emptyMessage}</div>
                    {emptyDescription && (
                      <p className="text-xs text-gray-500 leading-relaxed">{emptyDescription}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);

                // Escape Hatch: Jika renderRow disediakan, serahkan sepenuhnya ke caller
                if (renderRow) {
                  return <React.Fragment key={key}>{renderRow(record, index)}</React.Fragment>;
                }

                const customRowClass = rowClassName ? rowClassName(record, index) : '';

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(record, index)}
                    className={cn(
                      'hover:bg-gray-50/70 transition-colors',
                      onRowClick && 'cursor-pointer',
                      customRowClass
                    )}
                  >
                    {columns.map((col) => {
                      const rawValue = record[col.key];
                      const renderedContent = col.render
                        ? col.render(rawValue, record, index)
                        : rawValue != null
                        ? String(rawValue)
                        : '-';

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'py-3.5 px-4',
                            getAlignmentClass(col.align),
                            col.className
                          )}
                        >
                          {renderedContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!hidePagination && pagination && onPaginationChange && (
        <TablePagination
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          itemLabel={itemLabel}
          pageSizeOptions={pageSizeOptions}
          isLoading={isLoading}
          activeColorClassName={paginationActiveColorClassName}
        />
      )}
    </div>
  );
}
