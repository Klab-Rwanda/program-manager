"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './RoleContext';
import { 
    getNotifications, 
    markAllNotificationsAsRead, 
    toggleNotificationReadStatus, // Updated import
    deleteNotification,           // New import
    Notification 
} from '../services/notification.service';
import { toast } from 'sonner';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    refreshNotifications: () => Promise<void>; // Added refresh function
    markAllAsRead: () => void;
    toggleReadStatus: (notificationId: string, currentStatus: boolean) => Promise<void>; // Added for individual toggle
    deleteOneNotification: (notificationId: string) => Promise<void>; // Added for individual delete
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    // Use user._id as the room name for personal notifications
    const socket = useSocket(user?._id?.toString()); 
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial and refresh notifications
    const refreshNotifications = useCallback(async () => {
        if (user) {
            setIsLoading(true);
            try {
                const data = await getNotifications(1); // Fetch first page
                setNotifications(data.docs);
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
                toast.error("Failed to load your notifications.");
            } finally {
                setIsLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        // Only attempt to fetch if user is defined (i.e., authenticated and loaded)
        if (user) {
            refreshNotifications();
        } else if (!user && !isLoading) {
            // If user logs out, clear notifications
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, refreshNotifications]);
    
    // Listen for real-time notifications from the WebSocket server
    useEffect(() => {
        if (!socket || !user) return;

        // Ensure the socket is connected to the user's personal room
        socket.emit('join_session_room', { sessionId: user._id.toString() }); // Using sessionId for room name consistent with backend socket.io setup

        const handleNewNotification = (newNotification: Notification) => {
            // Add the new notification to the top of the list
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show a toast for the incoming notification
            toast.info(newNotification.title, {
                description: newNotification.message,
                duration: 5000,
                // Add an action button to view the notification or mark as read in the toast
                action: {
                    label: newNotification.link ? 'View' : 'Mark Read',
                    onClick: () => {
                        if (newNotification.link) {
                            window.location.href = newNotification.link;
                        } else {
                            toggleReadStatus(newNotification._id, true); // Mark as read if no link
                        }
                    },
                },
            });
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
            // On disconnect or component unmount, consider leaving the room if persistent connection isn't needed
            // newSocket.emit('leave_session_room', user._id.toString()); // If you implement leave room on backend
        };
    }, [socket, user]); // Depend on user to re-establish if user changes/logs in

    const markAllAsRead = async () => {
        try {
            const result = await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(result.unreadCount);
            toast.success("All notifications marked as read.");
        } catch (error) {
            toast.error("Failed to mark notifications as read.");
        }
    };

    const toggleReadStatus = async (notificationId: string, currentStatus: boolean) => {
        try {
            const result = await toggleNotificationReadStatus(notificationId, !currentStatus);
            setNotifications(prev => prev.map(n => n._id === notificationId ? result.notification : n));
            setUnreadCount(result.unreadCount);
            toast.success(`Notification marked as ${result.notification.isRead ? 'read' : 'unread'}.`);
        } catch (error) {
            toast.error("Failed to update notification status.");
        }
    };

    const deleteOneNotification = async (notificationId: string) => {
        try {
            const result = await deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            setUnreadCount(result.unreadCount);
            toast.success("Notification deleted.");
        } catch (error) {
            toast.error("Failed to delete notification.");
        }
    };

    const value = { notifications, unreadCount, isLoading, refreshNotifications, markAllAsRead, toggleReadStatus, deleteOneNotification };

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