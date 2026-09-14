import * as React from "react";
import { cn } from "../../lib/utils";

export interface SearchNotificationProps {
  /** Jumlah data yang ditemukan */
  total: number;
  /** Label objek data, default: 'produk' */
  itemLabel?: string;
  /** Kata kunci pencarian saat ini (opsional) */
  search?: string;
  /** Nama kategori atau filter kategori yang sedang aktif */
  category?: string;
  /** Label untuk opsi semua kategori, default: 'semua kategori' */
  allCategoryLabel?: string;
  /** Label teks sort yang sedang aktif (misal: 'termurah', 'terbaru', 'A - Z') */
  sortLabel?: string;
  /** Kunci sort aktif (misal: 'createdAt-desc', 'price-asc') */
  sortKey?: string;
  /** Peta pengubah kunci sort ke label bahasa Indonesia */
  sortLabelsMap?: Record<string, string>;
  /** Kustom class nama untuk styling lanjutan */
  className?: string;
}

const DEFAULT_SORT_MAP: Record<string, string> = {
  "createdAt-desc": "terbaru",
  "createdAt-asc": "terlama",
  "price-asc": "termurah",
  "price-desc": "termahal",
  "stock-asc": "stok paling sedikit",
  "stock-desc": "stok paling banyak",
  "title-asc": "nama (A - Z)",
  "title-desc": "nama (Z - A)",
};

/**
 * SearchNotification
 * Komponen standar notifikasi ringkasan pencarian, filter, dan sorting tabel.
 * Murni mengandalkan tipografi & font-color (tanpa background-color) sesuai kaidah taste-skill.
 */
export const SearchNotification: React.FC<SearchNotificationProps> = ({
  total,
  itemLabel = "produk",
  search,
  category = "Semua",
  allCategoryLabel = "semua kategori",
  sortLabel,
  sortKey,
  sortLabelsMap = DEFAULT_SORT_MAP,
  className,
}) => {
  const cleanSearch = search?.trim();

  // Evaluasi label kategori
  const isAllCategory =
    !category ||
    category.toLowerCase() === "semua" ||
    category.toLowerCase() === "all" ||
    category.toLowerCase() === allCategoryLabel.toLowerCase();

  const formattedCategory = isAllCategory
    ? allCategoryLabel
    : `kategori ${category}`;

  // Evaluasi label pengurutan (sort)
  const resolvedSort =
    sortLabel ||
    (sortKey ? sortLabelsMap[sortKey] || sortKey : undefined);

  // Status jika tidak ada data ditemukan (0 hasil)
  if (total === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 transition-colors py-1",
          className
        )}
      >
        <span>Tidak ditemukan {itemLabel}</span>
        {cleanSearch && (
          <span>
            {" "}untuk kata kunci <span className="font-semibold underline underline-offset-2">"{cleanSearch}"</span>
          </span>
        )}
        <span> dengan {formattedCategory}</span>
        {resolvedSort && <span> {resolvedSort}</span>}.
      </div>
    );
  }

  // Status ketika data ditemukan (total > 0)
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors py-1",
        className
      )}
    >
      <span>Ditemukan </span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {total} {itemLabel}
      </span>
      {cleanSearch && (
        <span>
          {" "}untuk kata kunci <span className="font-semibold text-gray-900 dark:text-gray-100">"{cleanSearch}"</span>
        </span>
      )}
      <span> dengan </span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {formattedCategory}
      </span>
      {resolvedSort && (
        <span>{" "}<span className="font-semibold text-gray-900 dark:text-gray-100">{resolvedSort}</span></span>
      )}
    </div>
  );
};
