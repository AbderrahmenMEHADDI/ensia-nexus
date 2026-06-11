/**
 * NotificationBell
 *
 * A bell icon button in the app header that shows:
 *  - An animated badge with the unread count
 *  - A dropdown panel with the notification list
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, Trash2, ClipboardCheck, FileText, FileInput, Handshake, MailCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types';

// ── Icon / color per notification type ─────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  TASK_ASSIGNED: {
    icon: <ClipboardCheck className="size-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  APPLICATION_STATUS: {
    icon: <FileText className="size-4" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  NEW_APPLICATION: {
    icon: <FileInput className="size-4" />,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  NEW_COLLABORATION_SUBMISSION: {
    icon: <Handshake className="size-4" />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  COLLABORATION_SUBMISSION_STATUS: {
    icon: <MailCheck className="size-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
};

const DEFAULT_META = {
  icon: <Bell className="size-4" />,
  color: 'text-slate-600',
  bg: 'bg-slate-100',
};

function getMeta(type: string) {
  return TYPE_META[type] ?? DEFAULT_META;
}

// ── Relative time formatting ────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Notification item ───────────────────────────────────────────────────────
function NotifItem({
  notif,
  onRead,
  onDelete,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: (notif: Notification) => void;
}) {
  const meta = getMeta(notif.type);

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
        notif.is_read ? 'opacity-60' : ''
      }`}
      onClick={() => onNavigate(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(notif)}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-indigo-500" />
      )}

      {/* Icon */}
      <div
        className={`flex-shrink-0 flex items-center justify-center size-8 rounded-full ${meta.bg} ${meta.color} mt-0.5`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-slate-800 leading-snug ${notif.is_read ? '' : 'font-semibold'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">{notif.content}</p>
        <p className="text-[11px] text-slate-400 mt-1">{relativeTime(notif.created_at)}</p>
      </div>

      {/* Delete button */}
      <button
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 self-start mt-0.5"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notif.id);
        }}
        title="Delete"
        aria-label="Delete notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── Main bell component ─────────────────────────────────────────────────────
export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotification, clearRead } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNavigate = useCallback(
    (notif: Notification) => {
      markRead(notif.id);
      if (notif.link) {
        navigate(notif.link);
        setOpen(false);
      }
    },
    [markRead, navigate]
  );

  const hasRead = notifications.some((n) => n.is_read);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          id="notification-bell"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          className="relative flex items-center justify-center size-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-xl shadow-xl border border-slate-200/80 bg-white overflow-hidden"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 gap-1"
                onClick={markAllRead}
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5" />
                All read
              </Button>
            )}
            {hasRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-400 hover:text-red-500 gap-1"
                onClick={clearRead}
                title="Clear read notifications"
              >
                <Trash2 className="size-3.5" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto divide-y divide-slate-100/80" style={{ maxHeight: 'calc(80vh - 56px)' }}>
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <div className="size-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Unread first */}
              {notifications.filter((n) => !n.is_read).map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))}
              {/* Read */}
              {notifications.filter((n) => n.is_read).map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="relative mb-4">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Bell className="size-7 text-slate-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-indigo-100 flex items-center justify-center">
          <CheckCheck className="size-3.5 text-indigo-500" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600">All caught up!</p>
      <p className="text-xs text-slate-400 mt-1">No notifications yet. We'll let you know when something happens.</p>
    </div>
  );
}
