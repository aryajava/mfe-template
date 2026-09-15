import React from "react";
import { Toaster as RawToaster, toast } from "sonner";

export type ToasterProps = React.ComponentProps<typeof RawToaster>;

/**
 * SonnerToaster
 * Notifikasi toast terstandarisasi:
 * - Posisi default: kanan atas ('top-right')
 * - Memiliki pembeda warna dan ikon yang jelas untuk success, error, warning, dan info
 * - richColors aktif secara default dengan kontras tinggi (WCAG AA)
 */
export const SonnerToaster: React.FC<ToasterProps> = ({
  position = "top-right",
  richColors = true,
  closeButton = true,
  className,
  toastOptions,
  ...props
}) => {
  return (
    <RawToaster
      position={position}
      richColors={richColors}
      closeButton={closeButton}
      className={className}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "group toast font-sans rounded-xl text-sm font-medium shadow-md border",
          description: "text-xs font-normal opacity-90",
          actionButton: "text-xs font-semibold px-3 py-1.5 rounded-lg",
          cancelButton: "text-xs font-medium px-3 py-1.5 rounded-lg",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
};

export { SonnerToaster as Toaster };
export { toast, toast as sonnerToast };
export type { ToastT, ExternalToast } from "sonner";
