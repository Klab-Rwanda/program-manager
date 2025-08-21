import api from './api';
import { AttendanceRecord } from '../types';

export const attendanceService = {
  // Get attendance history for current user
  getMyAttendanceHistory: async (): Promise<AttendanceRecord[]> => {
    try {
      const response = await api.get('/attendance/my-history');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }
  },

  // Mark attendance via QR code
  markQRAttendance: async (sessionId: string, qrCode: string) => {
    try {
      const response = await api.post('/attendance/qr', {
        sessionId,
        qrCode,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error marking QR attendance:', error);
      throw error;
    }
  },

  // Mark attendance via geolocation
  markGeolocationAttendance: async (sessionId: string, location: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const response = await api.post('/attendance/geolocation', {
        sessionId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error marking geolocation attendance:', error);
      throw error;
    }
  },

  // Get current session QR code
  getSessionQRCode: async (sessionId: string) => {
    try {
      const response = await api.get(`/attendance/session/${sessionId}/qr`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching session QR code:', error);
      return null;
    }
  },

  // Get trainee sessions for a program
  getTraineeSessions: async (programId: string) => {
    try {
      const response = await api.get('/attendance/trainee/sessions');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching trainee sessions:', error);
      return [];
    }
  },

  // Get attendance report for a program
  getProgramAttendanceReport: async (programId: string) => {
    try {
      const response = await api.get(`/attendance/program/${programId}/report`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      return null;
    }
  },
}; 