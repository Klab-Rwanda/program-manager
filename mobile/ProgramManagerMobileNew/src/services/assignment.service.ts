import api from './api';
import { Assignment, Submission } from '../types';

export const assignmentService = {
  // Get assignments for a program
  getProgramAssignments: async (programId: string): Promise<Assignment[]> => {
    try {
      const response = await api.get(`/assignments/program/${programId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching program assignments:', error);
      return [];
    }
  },

  // Get all assignments for current user
  getMyAssignments: async (): Promise<Assignment[]> => {
    try {
      const response = await api.get('/assignments/my-available');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching my assignments:', error);
      return [];
    }
  },

  // Get assignment by ID
  getAssignmentById: async (id: string): Promise<Assignment | null> => {
    try {
      const response = await api.get(`/assignments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      return null;
    }
  },

  // Submit assignment
  submitAssignment: async (assignmentId: string, submission: {
    content: string;
    files?: File[];
  }): Promise<Submission> => {
    try {
      const formData = new FormData();
      formData.append('content', submission.content);
      
      if (submission.files) {
        submission.files.forEach((file, index) => {
          formData.append(`files`, file);
        });
      }

      const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  },

  // Get submission by ID
  getSubmissionById: async (id: string): Promise<Submission | null> => {
    try {
      const response = await api.get(`/submissions/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching submission:', error);
      return null;
    }
  },

  // Get my submissions
  getMySubmissions: async (): Promise<Submission[]> => {
    try {
      const response = await api.get('/submissions/my-submissions');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      return [];
    }
  },
}; 