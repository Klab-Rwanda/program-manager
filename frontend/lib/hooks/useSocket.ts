import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export const useSocket = (roomName: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!roomName) return;

        // Create and connect the socket
        const newSocket = io(SOCKET_URL);
        
        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server!');
            // Automatically join the session room upon connection
            newSocket.emit('join_session_room', roomName);
        });

        setSocket(newSocket);

        // Cleanup function to disconnect socket when component unmounts
        return () => {
            newSocket.disconnect();
        };
    }, [roomName]);

    return socket;
};