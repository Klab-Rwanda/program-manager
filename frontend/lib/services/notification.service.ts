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
 * Marks a single notification as read by its ID.
 * @param notificationId The ID of the notification to mark as read.
 * @returns A promise that resolves to the updated notification object.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
};