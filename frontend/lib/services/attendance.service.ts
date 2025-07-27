import api from '../api';
// --- THIS IS THE FIX ---
// Import all necessary types from the central types file
import { Program, ClassSession, AttendanceRecord } from '@/types';
// --- END OF FIX ---

// Note: All local interface definitions for ClassSession and AttendanceRecord have been removed.

// --- Manager/Admin Reporting Services ---

export const getProgramAttendanceReport = async (programId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(`/attendance/report/program/${programId}`, {
        params: { startDate, endDate }
    });
    return response.data.data;
};

export const getSessionAttendance = async (sessionId: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(`/attendance/sessions/${sessionId}/attendance`);
    return response.data.data;
};

// --- Trainee Services ---

export const getMyAttendanceHistory = async (): Promise<AttendanceRecord[]> => {
    const response = await api.get('/attendance/my-history');
    return response.data.data;
};

export const getTraineeSessions = async (): Promise<ClassSession[]> => {
    const response = await api.get('/attendance/trainee/sessions');
    return response.data.data;
};

export const markQRAttendance = async (qrData: string): Promise<any> => {
    const response = await api.post('/attendance/qr-attendance', { qrData });
    return response.data.data;
};

export const markGeolocationAttendance = async (sessionId: string, latitude: number, longitude: number): Promise<any> => {
    const response = await api.post('/attendance/geolocation-attendance', { sessionId, latitude, longitude });
    return response.data.data;
};

// --- Facilitator Services ---

export const createSession = async (sessionData: any): Promise<ClassSession> => {
    const response = await api.post('/attendance/sessions', sessionData);
    return response.data.data;
};

export const getFacilitatorSessions = async (): Promise<ClassSession[]> => {
    const response = await api.get('/attendance/facilitator/sessions');
    return response.data.data;
};


export const startOnlineSession = async (sessionId: string): Promise<{ session: ClassSession }> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start-online`);
    return response.data.data;
};

export const startPhysicalSession = async (sessionId: string): Promise<ClassSession> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start-physical`);
    return response.data.data;
};

export const openQrForSession = async (sessionId: string): Promise<{ qrCodeImage: string }> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/open-qr`);
    return response.data.data;
};

export const getSessionDetails = async (sessionId: string): Promise<{ session: ClassSession; attendanceCount: number }> => {
    const response = await api.get(`/attendance/sessions/${sessionId}`);
    return response.data.data;
};

export const endSession = async (sessionId: string): Promise<ClassSession> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/end`);
    return response.data.data;
};