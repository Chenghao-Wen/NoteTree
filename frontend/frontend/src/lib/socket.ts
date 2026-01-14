import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().token;
    if (!token || this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'], // 强制 websocket，避免轮询延迟
    });

    this.socket.on('connect', () => {
      console.log('WS Connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('WS Connection Error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 泛型订阅方法
  subscribe<T>(event: string, callback: (data: T) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
    return () => {
      this.socket?.off(event, callback);
    };
  }
}

export const socketService = new SocketService();