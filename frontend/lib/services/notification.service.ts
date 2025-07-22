import api from '../api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// This function fixes the 404 error
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications/unread');
  return response.data.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};