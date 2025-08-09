import api from './api';
import { Program } from '../types';

export const programService = {
  // Get all programs (filtered by user role)
  getAllPrograms: async (): Promise<Program[]> => {
    try {
      const response = await api.get('/programs');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
  },

  // Get program by ID
  getProgramById: async (id: string): Promise<Program | null> => {
    try {
      const response = await api.get(`/programs/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching program:', error);
      return null;
    }
  },

  // Get programs for current user (enrolled programs for trainees)
  getMyPrograms: async (): Promise<Program[]> => {
    try {
      const response = await api.get('/programs');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching my programs:', error);
      return [];
    }
  },

  // Get program statistics
  getProgramStats: async (programId: string) => {
    try {
      const response = await api.get(`/programs/${programId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching program stats:', error);
      return null;
    }
  },
}; 