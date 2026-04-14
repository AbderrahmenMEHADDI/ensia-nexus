import { api } from '../lib/apiClient';
import type { ChatRoom, ChatMessage } from '@/types';

/**
 * Chat Repository for various entities.
 * Methods here handle CRUD operations for rooms and fetching messages.
 */
export const chatRepository = {
  // Rooms
  getRooms: () => api.get<ChatRoom[]>('/chat/rooms'),
  createRoom: (data: Partial<ChatRoom>) => api.post<ChatRoom>('/chat/rooms', data),

  // Messages
  getMessages: (roomId: number) => api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`),
  deleteMessage: (messageId: number) => api.delete<void>(`/chat/messages/${messageId}`),

  // WebSocket URL helper
  getWsUrl: (roomId: number) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend host, not the frontend one
    const host = import.meta.env.VITE_API_WS_URL || 'localhost:8000';
    return `${protocol}//${host}/api/v1/chat/ws/${roomId}`;
  }
};
