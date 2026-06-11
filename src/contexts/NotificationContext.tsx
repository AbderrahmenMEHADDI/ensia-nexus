/**
 * NotificationContext
 *
 * Manages:
 *  - initial fetch of notifications from REST API
 *  - real-time WebSocket push from the backend (/ws/{userId})
 *  - optimistic state updates (mark read, delete, clear read)
 *  - toast pop-ups for incoming real-time notifications
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { Notification } from '@/types';
import { BASE_URL } from '@/lib/apiClient';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};

// Derive WebSocket URL from the API base URL
function wsUrl(userId: number): string {
  const apiBase = BASE_URL; // e.g. http://localhost:8000/api/v1
  const base = apiBase.replace(/^https?:\/\//, '').split('/')[0]; // localhost:8000
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${base}/ws/${userId}`;
}

const RECONNECT_INITIAL_MS = 2000;
const RECONNECT_MAX_MS = 30000;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(RECONNECT_INITIAL_MS);
  const unmounting = useRef(false);

  // ── REST fetch ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await apiRepository.getNotifications({ limit: 50 });
      setNotifications(data.items);
    } catch {
      // silently fail — user still sees stale data
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, refresh]);

  // ── WebSocket ──────────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    // WebSockets and in-app notifications are disabled. Only email notifications are kept.
    return;
  }, []);

  useEffect(() => {
    unmounting.current = false;
    if (isAuthenticated && user) {
      connectWS();
    }
    return () => {
      unmounting.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [isAuthenticated, user?.id, connectWS]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: number) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await apiRepository.markNotificationAsRead(id);
    } catch {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiRepository.markAllNotificationsAsRead();
    } catch {
      setNotifications(snapshot);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: number) => {
    const snapshot = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiRepository.deleteNotification(id);
    } catch {
      setNotifications(snapshot);
    }
  }, [notifications]);

  const clearRead = useCallback(async () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      await apiRepository.clearReadNotifications();
    } catch {
      setNotifications(snapshot);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markRead,
        markAllRead,
        deleteNotification,
        clearRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────
function notifIcon(type: string): string {
  switch (type) {
    case 'TASK_ASSIGNED':              return '📋';
    case 'APPLICATION_STATUS':         return '📩';
    case 'NEW_APPLICATION':            return '📥';
    case 'NEW_COLLABORATION_SUBMISSION': return '🤝';
    case 'COLLABORATION_SUBMISSION_STATUS': return '📬';
    default:                           return '🔔';
  }
}
