import api from './api';
import { AttendanceRecord, ClassSession } from '../types';

// Mark QR attendance - Same API as web app
export const markQRAttendance = async (qrData: string): Promise<any> => {
  const response = await api.post('/attendance/qr-attendance', { qrData });
  return response.data.data;
};

// Mark geolocation attendance - Same API as web app
export const markGeolocationAttendance = async (data: {
  sessionId: string;
  latitude: number;
  longitude: number;
}): Promise<any> => {
  const response = await api.post('/attendance/geolocation-attendance', data);
  return response.data.data;
};

// Get trainee sessions - Same API as web app
export const getTraineeSessions = async (): Promise<ClassSession[]> => {
  const response = await api.get('/attendance/trainee/sessions');
  return response.data.data;
};

// Get attendance history - Same API as web app
export const getMyAttendanceHistory = async (programId?: string): Promise<AttendanceRecord[]> => {
  const params = programId ? { programId } : {};
  const response = await api.get('/attendance/my-history', { params });
  return response.data.data;
};

// Get session QR code - Same API as web app
export const getSessionQRCode = async (sessionId: string): Promise<{ qrCodeImage: string }> => {
  const response = await api.get(`/attendance/session/${sessionId}/qr`);
  return response.data.data;
};

// Get program attendance report - Same API as web app
export const getProgramAttendanceReport = async (
  programId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> => {
  const response = await api.get(`/attendance/program/${programId}/report`, {
    params: { startDate, endDate }
  });
  return response.data.data;
}; 