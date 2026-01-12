import api from '../api';
import { Announcement, CreateAnnouncementData } from '@/types';

// Get all announcements for current user's programs
export const getMyAnnouncements = async (): Promise<Announcement[]> => {
    const response = await api.get('/announcements/my-announcements');
    return response.data.data;
};

// Get announcements by program
export const getAnnouncementsByProgram = async (programId: string): Promise<Announcement[]> => {
    const response = await api.get(`/announcements/program/${programId}`);
    return response.data.data;
};

// Create a new announcement
export const createAnnouncement = async (data: CreateAnnouncementData): Promise<Announcement> => {
    const response = await api.post('/announcements', data);
    return response.data.data;
};

// Mark announcement as read
export const markAnnouncementAsRead = async (announcementId: string): Promise<void> => {
    await api.patch(`/announcements/${announcementId}/read`);
};

// Update an announcement
export const updateAnnouncement = async (announcementId: string, data: Partial<CreateAnnouncementData>): Promise<Announcement> => {
    const response = await api.patch(`/announcements/${announcementId}`, data);
    return response.data.data;
};

// Delete an announcement
export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    await api.delete(`/announcements/${announcementId}`);
};
