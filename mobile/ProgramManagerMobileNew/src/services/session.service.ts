import api from './api';
import { ClassSession } from '../types';

export const sessionService = {
  // Get trainee's sessions
  getTraineeSessions: async (): Promise<ClassSession[]> => {
    try {
      const response = await api.get('/attendance/trainee/sessions');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching trainee sessions:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get upcoming sessions for trainee
  getUpcomingSessions: async (): Promise<ClassSession[]> => {
    try {
      const response = await api.get('/attendance/trainee/sessions');
      const allSessions = response.data.data || [];
      
      // Filter for upcoming sessions (scheduled or active)
      const now = new Date();
      return allSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate > now && (session.status === 'scheduled' || session.status === 'active');
      }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get next session for trainee
  getNextSession: async (): Promise<ClassSession | null> => {
    try {
      const upcomingSessions = await sessionService.getUpcomingSessions();
      return upcomingSessions.length > 0 ? upcomingSessions[0] : null;
    } catch (error) {
      console.error('Error fetching next session:', error);
      // Return null instead of throwing
      return null;
    }
  },
}; 