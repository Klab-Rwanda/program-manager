import api from '../api';

// --- Type Imports ---
// Make sure StudentSummary is defined in your @/types file, or add it as shown below.
import { Program, AttendanceRecord, StudentSummary } from '@/types';


// ===================================================================
//   TYPE DEFINITIONS (Ensure these are in your @/types/index.ts)
// ===================================================================

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
  };
  sessionId: string;
  title: string;
  description?: string;
  startTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  accessLink?: string;
  meetingLink?: string;
  qrCodeImage?: string; // Frontend-only convenience field
  updatedAt: string;
}

/* 
  NOTE: Ensure this StudentSummary type is added to your main types file (e.g., '@/types/index.ts')
  so it can be imported and used across your app.
*/
/*
export interface StudentSummary {
  userId: string;
  name: string;
  email: string;
  role: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  records: {
    date: string;
    status: string;
    timestamp: string;
    checkIn?: string;
    sessionTitle?: string;
    method: string;
  }[];
}
*/


// ===================================================================
//   MANAGER / REPORTING SERVICES
// ===================================================================

/**
 * NEW: Fetches an aggregated summary of attendance for a program, grouped by student.
 * This is for the new manager dashboard view.
 */
export const getProgramAttendanceSummary = async (programId: string, startDate: string, endDate: string): Promise<{ totalSessions: number, report: StudentSummary[] }> => {
    const response = await api.get(`/attendance/report/program/${programId}/summary`, {
        params: { startDate, endDate }
    });
    return response.data.data;
};

/**
 * LEGACY: Fetches a flat list of all attendance records for a program.
 * Good for a detailed log view or exporting raw data.
 */
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


// ===================================================================
//   TRAINEE SERVICES
// ===================================================================

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


// ===================================================================
//   FACILITATOR SERVICES
// ===================================================================

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

export const startPhysicalSession = async (sessionId: string, latitude: number, longitude: number): Promise<ClassSession> => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start-physical`, { latitude, longitude });
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