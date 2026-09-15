import React from "react";
import { useEventSubscription } from "../../hooks/useEventBus";
import { MFE_EVENTS } from "../../lib/eventBus";
import { sonnerToast } from "../ui/sonner";

export interface NotificationPayload {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

/**
 * NotificationListener (Headless)
 * Mendengarkan sinyal event NOTIFICATION_SHOW dari EventBus
 * dan memicu Sonner Toast dengan status warna yang sesuai.
 * Tidak merender elemen visual apapun ke DOM.
 */
export const NotificationListener: React.FC = () => {
  useEventSubscription(MFE_EVENTS.NOTIFICATION_SHOW, (data: any) => {
    const msg = typeof data === "string" ? data : data?.message;
    if (!msg) return;

    const type = (data?.type || "success") as "success" | "error" | "warning" | "info";
    const duration = data?.duration;
    const opts = duration ? { duration } : undefined;

    switch (type) {
      case "error":
        sonnerToast.error(msg, opts);
        break;
      case "warning":
        sonnerToast.warning(msg, opts);
        break;
      case "info":
        sonnerToast.info(msg, opts);
        break;
      case "success":
      default:
        sonnerToast.success(msg, opts);
        break;
    }
  });

  return null;
};
