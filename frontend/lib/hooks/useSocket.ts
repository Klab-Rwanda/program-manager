// lib/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Dynamically resolve the WebSocket URL
let SOCKET_URL = 'http://localhost:8000'; // Default local dev fallback


if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;

  if (hostname.includes('andasy')) {
    SOCKET_URL = 'https://backendklab.andasy.dev';
  } else if (hostname.includes('vercel')) {
    SOCKET_URL = 'https://program-manager-klab.onrender.com';
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    // Strip off /api/v1 if present
    SOCKET_URL = process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '');
  }
}

export const useSocket = (roomId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!roomId) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log(`Connected to WebSocket server. Socket ID: ${newSocket.id}`);
      const token = localStorage.getItem('accessToken');
      if (token) {
        newSocket.emit('authenticate', { token });
      } else {
        console.warn('No access token found for socket authentication.');
      }
    });

    newSocket.on('authenticated', (data: { status: string, userId: string }) => {
      if (data.status === 'success') {
        console.log(`Socket authenticated for user: ${data.userId}`);
        if (roomId && roomId !== data.userId) {
          newSocket.emit('join_session_room', { sessionId: roomId, userId: data.userId });
        }
      } else {
        console.error('Socket authentication failed:', data);
        newSocket.disconnect();
      }
    });

    newSocket.on('unauthorized', (data: { message: string }) => {
      console.error('Socket unauthorized:', data.message);
      newSocket.disconnect();
    });


    newSocket.on('disconnect', () => {
      console.log(`Disconnected from WebSocket server. Room ID: ${roomId}`);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO Connection Error:', err.message);
    });

    setSocket(newSocket);


    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);


  return socket;
};
