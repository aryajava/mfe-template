import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Resolusi icon Lucide dinamis berdasarkan string identifier dari API / database.
 * Mendukung format PascalCase ("Package"), kebab-case ("package", "shopping-bag"), atau snake_case.
 * Jika tidak ditemukan / rusak, fallback ke komponen FallbackComponent (misal Box atau Layers).
 */
export function resolveLucideIcon(
  iconName: string | null | undefined,
  FallbackComponent: React.ComponentType<{ className?: string }>
): React.ComponentType<{ className?: string }> {
  if (!iconName || typeof iconName !== 'string') {
    return FallbackComponent;
  }

  const clean = iconName.trim();
  if (!clean) return FallbackComponent;

  // 1. Coba kecocokan langsung (misal "Package", "ShoppingBag")
  const directMatch = (LucideIcons as Record<string, any>)[clean];
  if (directMatch && (typeof directMatch === 'function' || typeof directMatch === 'object')) {
    return directMatch;
  }

  // 2. Normalisasi kebab-case / snake_case ke PascalCase (misal "shopping-bag" -> "ShoppingBag")
  const pascalName = clean
    .replace(/[-_ ]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());

  const pascalMatch = (LucideIcons as Record<string, any>)[pascalName];
  if (pascalMatch && (typeof pascalMatch === 'function' || typeof pascalMatch === 'object')) {
    return pascalMatch;
  }

  // 3. Fallback pencarian case-insensitive jika ejaan huruf berbeda
  const lowerClean = clean.toLowerCase().replace(/[-_ ]/g, '');
  for (const [key, comp] of Object.entries(LucideIcons)) {
    if (key.toLowerCase() === lowerClean && (typeof comp === 'function' || typeof comp === 'object')) {
      return comp as React.ComponentType<{ className?: string }>;
    }
  }

  return FallbackComponent;
}
