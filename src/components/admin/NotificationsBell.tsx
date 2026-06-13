import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationsBell = ({ align = 'right' }: { align?: 'left' | 'right' }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card shadow-lg`}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-heading text-sm font-bold text-foreground">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center font-body text-sm text-muted-foreground">
                Sin notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors ${
                    n.is_read ? 'opacity-60' : 'bg-accent/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-foreground">{n.title}</p>
                    <p className="font-body text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 font-body text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
