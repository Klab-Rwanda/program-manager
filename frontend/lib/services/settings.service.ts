import api from '../api';

// This type should match the structure of your Setting model
export interface AppSettings {
    _id: string;
    siteName: string;
    siteLogoUrl: string;
    defaultProgramDurationDays: number;
    allowManagerProgramCreation: boolean;
    sendWelcomeEmail: boolean;
    adminNotificationEmail?: string;
}

export const getAppSettings = async (): Promise<AppSettings> => {
    const response = await api.get('/settings');
    return response.data.data;
};

export const updateAppSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const response = await api.patch('/settings', settings);
    return response.data.data;
};