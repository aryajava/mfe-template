import React, { useState } from 'react';
import { useEventSubscription, MFE_EVENTS, sonnerToast } from '@template/shared';
import { Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Pasang pendengar: Begitu ada event NOTIFICATION_SHOW, jalankan fungsi ini
  useEventSubscription(MFE_EVENTS.NOTIFICATION_SHOW, (data: any) => {
    const msg = data?.message || 'Notifikasi dari Child MFE!';
    setLastMessage(msg);
    sonnerToast.success(msg);
  });

  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-xs font-medium text-orange-800">
      <Bell className={`h-3.5 w-3.5 text-orange-600 ${lastMessage ? 'animate-bounce' : ''}`} />
      <span>{lastMessage ? `[EventBus]: ${lastMessage}` : 'EventBus Siaga (Menunggu sinyal...)'}</span>
    </div>
  );
};

