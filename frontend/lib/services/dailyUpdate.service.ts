import api from '../api';
import { DailyUpdate, CreateDailyUpdateData, DailyUpdatesResponse } from '@/types';

// ============== Trainee Functions ==============

/**
 * Create a new daily update (Trainee)
 */
export const createDailyUpdate = async (data: CreateDailyUpdateData): Promise<DailyUpdate> => {
    const response = await api.post('/daily-updates', data);
    return response.data.data;
};

/**
 * Update an existing daily update (Trainee - only within 24 hours)
 */
export const updateDailyUpdate = async (id: string, data: Partial<CreateDailyUpdateData>): Promise<DailyUpdate> => {
    const response = await api.put(`/daily-updates/${id}`, data);
    return response.data.data;
};

/**
 * Get my daily updates (Trainee)
 */
export const getMyDailyUpdates = async (params?: {
    program?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<DailyUpdate[]> => {
    const response = await api.get('/daily-updates/my-updates', { params });
    return response.data.data;
};

/**
 * Get today's update for a specific program (Trainee)
 */
export const getTodayUpdate = async (programId: string): Promise<DailyUpdate | null> => {
    const response = await api.get(`/daily-updates/today/${programId}`);
    return response.data.data;
};

// ============== Facilitator/PM Functions ==============

/**
 * Get all daily updates for programs (Facilitator/PM)
 */
export const getAllDailyUpdates = async (params?: {
    program?: string;
    trainee?: string;
    startDate?: string;
    endDate?: string;
    isReviewed?: string;
    limit?: number;
    page?: number;
}): Promise<DailyUpdatesResponse> => {
    const response = await api.get('/daily-updates', { params });
    return response.data.data;
};

/**
 * Mark update as reviewed / add comment (Facilitator/PM)
 */
export const reviewDailyUpdate = async (id: string, reviewComment?: string): Promise<DailyUpdate> => {
    const response = await api.patch(`/daily-updates/${id}/review`, { reviewComment });
    return response.data.data;
};

/**
 * Get trainees for a program (for filter dropdown)
 */
export const getTraineesForProgram = async (programId: string): Promise<{ _id: string; name: string; email: string }[]> => {
    const response = await api.get(`/daily-updates/trainees/${programId}`);
    return response.data.data;
};

/**
 * Get today's submission status for all trainees in a program (Facilitator/PM)
 */
export interface TraineeSubmissionStatus {
    trainee: {
        _id: string;
        name: string;
        email: string;
    };
    hasSubmitted: boolean;
    update: {
        _id: string;
        workDone: string;
        isReviewed: boolean;
        createdAt: string;
    } | null;
}

export interface TodaySubmissionStatusResponse {
    date: string;
    program: {
        _id: string;
        name: string;
    };
    totalTrainees: number;
    submittedCount: number;
    notSubmittedCount: number;
    trainees: TraineeSubmissionStatus[];
}

export const getTodaySubmissionStatus = async (programId: string): Promise<TodaySubmissionStatusResponse> => {
    const response = await api.get(`/daily-updates/today-status/${programId}`);
    return response.data.data;
};

/**
 * Export daily updates to CSV (Facilitator/PM)
 */
export const exportDailyUpdates = async (params?: {
    program?: string;
    startDate?: string;
    endDate?: string;
}): Promise<void> => {
    const response = await api.get('/daily-updates/export', {
        params,
        responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Get filename from response header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `daily-updates-${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
            filename = filenameMatch[1];
        }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
