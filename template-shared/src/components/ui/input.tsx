import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Pesan error kustom untuk input dan validasi */
  error?: string;
  /** Izinkan nilai negatif pada input number (default: false) */
  allowNegative?: boolean;
  /** Izinkan angka desimal pada input number (default: false) */
  allowDecimal?: boolean;
  /** Maksimal angka di belakang koma (hanya jika allowDecimal = true) */
  maxDecimalDigits?: number;
  /** Indikator input nomor telepon untuk mempertahankan angka 0 di depan */
  isPhone?: boolean;
}

/**
 * Helper untuk sanitasi nilai angka:
 * - Menghapus tanda negatif jika allowNegative = false
 * - Menghapus desimal jika allowDecimal = false
 * - Membatasi jumlah desimal jika maxDecimalDigits disetel
 * - Menghapus angka 0 di depan (010 -> 10, 05 -> 5), KECUALI nomor telepon
 */
function sanitizeNumericValue(
  value: string,
  options: {
    allowNegative?: boolean;
    allowDecimal?: boolean;
    maxDecimalDigits?: number;
    isPhone?: boolean;
  }
): string {
  let val = value;
  if (!val) return val;

  // 1. Nomor telepon: pertahankan format asli (termasuk awalan 0)
  if (options.isPhone) {
    return val;
  }

  // 2. Cegah negatif jika allowNegative = false
  if (!options.allowNegative) {
    val = val.replace(/-/g, "");
  }

  // 3. Cegah desimal atau batasi digit desimal
  if (!options.allowDecimal) {
    if (val.includes(".")) {
      val = val.split(".")[0];
    }
    if (val.includes(",")) {
      val = val.split(",")[0];
    }
  } else {
    val = val.replace(/,/g, ".");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    if (options.maxDecimalDigits !== undefined && parts.length === 2) {
      val = `${parts[0]}.${parts[1].slice(0, options.maxDecimalDigits)}`;
    }
  }

  // 4. Hapus angka 0 di depan (leading zero)
  // Contoh: "01" -> "1", "010" -> "10", "007" -> "7"
  // Nilai "0" atau pecahan "0." dan "0.xx" tetap dipertahankan
  if (/^0+[1-9]/.test(val)) {
    val = val.replace(/^0+/, "");
  } else if (/^0+$/.test(val) && val.length > 1) {
    val = "0";
  } else if (/^0+0\./.test(val)) {
    val = val.replace(/^0+(?=0\.)/, "");
  }

  return val;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      allowNegative = false,
      allowDecimal = false,
      maxDecimalDigits,
      isPhone,
      onKeyDown,
      onChange,
      onInput,
      onFocus,
      onInvalid,
      ...props
    },
    ref
  ) => {
    // Deteksi apakah input diperlakukan sebagai nomor telepon
    const isPhoneNumber = Boolean(
      isPhone ||
        type === "tel" ||
        props.name?.toLowerCase().includes("phone") ||
        props.name?.toLowerCase().includes("telp") ||
        props.id?.toLowerCase().includes("phone") ||
        props.id?.toLowerCase().includes("telp") ||
        props.autoComplete === "tel"
    );

    const isNumeric = type === "number" || props.inputMode === "numeric";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumeric) {
        // Blokir notasi ilmiah 'e' atau 'E'
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          return;
        }

        // Blokir tanda minus/plus jika tidak diizinkan negatif
        if (!allowNegative && (e.key === "-" || e.key === "+")) {
          e.preventDefault();
          return;
        }

        // Blokir tanda titik/koma jika tidak diizinkan desimal
        if (!allowDecimal && (e.key === "." || e.key === ",")) {
          e.preventDefault();
          return;
        }

        // Jika desimal diizinkan, cegah titik kedua
        if (allowDecimal && (e.key === "." || e.key === ",")) {
          const current = e.currentTarget.value;
          if (current.includes(".") || current.includes(",")) {
            e.preventDefault();
            return;
          }
        }

        // Batasi jumlah digit desimal saat mengetik jika maxDecimalDigits disetel
        if (
          allowDecimal &&
          maxDecimalDigits !== undefined &&
          !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
        ) {
          const current = e.currentTarget.value;
          const dotIndex = current.indexOf(".");
          const selStart = e.currentTarget.selectionStart;
          if (
            dotIndex !== -1 &&
            selStart !== null &&
            selStart > dotIndex &&
            current.split(".")[1]?.length >= maxDecimalDigits &&
            e.currentTarget.selectionStart === e.currentTarget.selectionEnd &&
            /^\d$/.test(e.key)
          ) {
            e.preventDefault();
            return;
          }
        }
      }

      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumeric) {
        const raw = e.target.value;
        const cleaned = sanitizeNumericValue(raw, {
          allowNegative,
          allowDecimal,
          maxDecimalDigits,
          isPhone: isPhoneNumber,
        });

        if (cleaned !== raw) {
          e.target.value = cleaned;
        }
      }

      // Bersihkan pesan custom validity bawaan browser saat pengguna mengubah teks
      e.target.setCustomValidity("");

      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Saat pengguna fokus pada input angka (non-telepon), pilih seluruh teks
      // agar pengetikan angka langsung menggantikan nilai lama dan tidak menumpuk
      if (isNumeric && !isPhoneNumber) {
        e.target.select();
      }
      onFocus?.(e);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      e.currentTarget.setCustomValidity("");
      onInput?.(e);
    };

    const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget;

      // Pesan validasi standar Bahasa Indonesia (menggantikan bawaan browser)
      if (error) {
        target.setCustomValidity(error);
      } else if (target.validity.valueMissing) {
        target.setCustomValidity("Kolom ini wajib diisi.");
      } else if (target.validity.typeMismatch) {
        if (target.type === "email") {
          target.setCustomValidity("Format email tidak valid (contoh: nama@domain.com).");
        } else if (target.type === "url") {
          target.setCustomValidity("Format tautan tidak valid (contoh: https://domain.com).");
        } else {
          target.setCustomValidity("Format isian tidak sesuai.");
        }
      } else if (target.validity.rangeUnderflow) {
        target.setCustomValidity(`Nilai tidak boleh kurang dari ${target.min || 0}.`);
      } else if (target.validity.rangeOverflow) {
        target.setCustomValidity(`Nilai tidak boleh lebih dari ${target.max}.`);
      } else if (target.validity.stepMismatch) {
        target.setCustomValidity("Kelipatan atau format angka tidak sesuai.");
      } else if (target.validity.tooShort) {
        target.setCustomValidity(`Panjang teks minimal ${target.minLength} karakter.`);
      } else if (target.validity.tooLong) {
        target.setCustomValidity(`Panjang teks maksimal ${target.maxLength} karakter.`);
      } else if (target.validity.patternMismatch) {
        target.setCustomValidity("Format data tidak sesuai dengan pola yang ditentukan.");
      } else if (target.validity.badInput) {
        target.setCustomValidity("Masukkan isian angka yang valid.");
      } else {
        target.setCustomValidity("Isian belum sesuai ketentuan.");
      }

      onInvalid?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          error && "border-red-500 focus-visible:ring-red-400 bg-red-50/15",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : props["aria-invalid"]}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onInput={handleInput}
        onFocus={handleFocus}
        onInvalid={handleInvalid}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
