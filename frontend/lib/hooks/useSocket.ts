// lib/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

// Change the parameter name from userId to roomId for general use, but it will be userId for notifications
// For personal notifications, `roomId` will be `user._id`
export const useSocket = (roomId?: string) => { // roomId can be undefined (e.g. for general broadcast, or before user is loaded)
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Only connect if roomId is provided
        if (!roomId) {
            socket?.disconnect(); // Disconnect if roomId becomes null/undefined
            setSocket(null);
            return;
        }

        const newSocket = io(SOCKET_URL);
        
        newSocket.on('connect', () => {
            console.log(`Connected to WebSocket server! Socket ID: ${newSocket.id}`);
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Authenticate the socket connection with the JWT
                newSocket.emit('authenticate', { token });
            } else {
                console.warn('No access token found for socket authentication.');
            }
        });

        newSocket.on('authenticated', (data: { status: string, userId: string }) => {
            if (data.status === 'success') {
                console.log(`Socket authenticated for user: ${data.userId}`);
                // After authentication, if this socket is also meant for a specific room (like a classroom), join it
                // For *personal notifications*, joining the room is handled by the backend 'authenticate' logic.
                // For *classroom notifications*, we emit 'join_session_room' from the classroom page.
                if (roomId && roomId !== data.userId) { // If roomId is NOT the user's personal ID (e.g., a classroom ID)
                    newSocket.emit('join_session_room', { sessionId: roomId, userId: data.userId });
                }
            } else {
                console.error('Socket authentication failed:', data);
                newSocket.disconnect();
            }
        });

        newSocket.on('unauthorized', (data: { message: string }) => {
            console.error('Socket unauthorized:', data.message);
            newSocket.disconnect(); // Force disconnect if unauthorized
        });

        newSocket.on('disconnect', () => {
            console.log(`Disconnected from WebSocket server. Room ID: ${roomId}`);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket.IO Connection Error:', err.message);
        });

        setSocket(newSocket);

        // Cleanup function to disconnect socket when component unmounts
        return () => {
            newSocket.disconnect();
        };
    }, [roomId]); // Depend on roomId so socket reconnects/joins new room if it changes

    return socket;
};