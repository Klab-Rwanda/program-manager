import api from '../api';

// This interface must match the structure of your backend Notification model
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "approval";
  isRead: boolean;
  link?: string;
  createdAt: string;
  sender?: { _id: string; name: string }; // Optional, if populated
}

// This interface matches the paginated response from your backend controller
export interface NotificationsResponse {
    docs: Notification[];
    unreadCount: number;
    totalPages: number;
    page: number;
    // Add any other pagination fields your backend sends
}

/**
 * Fetches notifications for the currently logged-in user.
 * @param page The page number to fetch.
 * @returns A promise that resolves to a paginated list of notifications.
 */
export const getNotifications = async (page = 1): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', { params: { page, limit: 10 } });
    return response.data.data;
};

/**
 * Marks all of the user's notifications as read.
 * @returns A promise that resolves with the new unread count (which should be 0).
 */
export const markAllNotificationsAsRead = async (): Promise<{ unreadCount: number }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data.data;
};

/**
 * Toggles the read status of a single notification.
 * @param notificationId The ID of the notification to toggle.
 * @param isRead Optional: explicitly set to true/false. If omitted, it will flip the current status.
 * @returns A promise that resolves to the updated notification object and the new unread count.
 */
export const toggleNotificationReadStatus = async (notificationId: string, isRead?: boolean): Promise<{ notification: Notification; unreadCount: number }> => {
    const response = await api.patch(`/notifications/${notificationId}/toggle-read`, { isRead });
    return response.data.data;
};

/**
 * Deletes a single notification.
 * @param notificationId The ID of the notification to delete.
 * @returns A promise that resolves with the new unread count.
 */
export const deleteNotification = async (notificationId: string): Promise<{ unreadCount: number }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data.data;
};