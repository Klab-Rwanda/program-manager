"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './RoleContext';
import { getNotifications, markAllNotificationsAsRead, Notification } from '../services/notification.service';
import { toast } from 'sonner';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const socket = useSocket(user?._id); // Join a room named after the user's ID
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial notifications
    const fetchInitialNotifications = useCallback(async () => {
        if (user) {
            setIsLoading(true);
            try {
                const data = await getNotifications(1);
                setNotifications(data.docs);
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch initial notifications", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchInitialNotifications();
    }, [fetchInitialNotifications]);
    
    // Listen for real-time notifications from the WebSocket server
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (newNotification: Notification) => {
            // Add the new notification to the top of the list
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show a toast for the incoming notification
            toast.info(newNotification.title, {
                description: newNotification.message,
            });
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const markAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read.");
        } catch (error) {
            toast.error("Failed to mark notifications as read.");
        }
    };

    const value = { notifications, unreadCount, isLoading, markAllAsRead };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};