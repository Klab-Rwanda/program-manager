import api from '../api';
import { Program } from '@/types';

// Matches the backend ClassSession model
export interface ClassSession {
  _id: string;
  type: 'physical' | 'online';
  programId: {
    _id: string;
    name: string;
  };
  facilitatorId: {
    _id: string;
    name: string;
    email: string;
  };
  sessionId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  qrCodeData?: string;
  accessLink?: string;
  qrCodeImage?: string;
}

// Matches the backend Attendance model
export interface AttendanceRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    sessionId: string;
    timestamp: string;
    method: 'qr_code' | 'geolocation' | 'manual';
    status: 'present' | 'absent' | 'excused' | 'late';
}

// --- NEWLY ADDED FUNCTION ---
/**
 * Fetches the detailed information for a single class session.
 * @param sessionId The unique sessionId (UUID string) of the session.
 * @returns An object containing the session details.
 */
export const getSessionDetails = async (sessionId: string): Promise<{ session: ClassSession; attendanceCount: number }> => {
    const response = await api.get(`/attendance/sessions/${sessionId}`);
    return response.data.data;
};
// --- END OF NEWLY ADDED FUNCTION ---


// --- Facilitator Services ---

export const createSession = async (sessionData: any): Promise<ClassSession> => {
    const response = await api.post('/attendance/sessions', sessionData);
    return response.data.data;
};

export const getFacilitatorSessions = async (): Promise<ClassSession[]> => {
    const response = await api.get('/attendance/facilitator/sessions');
    return response.data.data;
};

export const startOnlineSession = async (sessionId: string): Promise<{ session: ClassSession, qrCode: string }> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start-online`);
    return {
      session: response.data.data.session,
      qrCode: response.data.data.qrCodeImage 
    };
};

export const startPhysicalSession = async (sessionId: string): Promise<ClassSession> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start-physical`);
    return response.data.data;
};

export const openQrForSession = async (sessionId: string): Promise<{ qrCodeImage: string }> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/open-qr`);
    return response.data.data;
};


// --- Trainee Services ---

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


// --- Reporting Services ---

export const getSessionAttendance = async (sessionId: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(`/attendance/sessions/${sessionId}/attendance`);
    return response.data.data;
};