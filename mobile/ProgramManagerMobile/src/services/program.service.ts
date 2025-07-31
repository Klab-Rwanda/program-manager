import api from './api';
import { Program } from '../types';

// Get all programs - Same API as web app
export const getAllPrograms = async (): Promise<Program[]> => {
  const response = await api.get('/programs');
  return response.data.data;
};

// Get program by ID - Same API as web app
export const getProgramById = async (id: string): Promise<Program> => {
  const response = await api.get(`/programs/${id}`);
  return response.data.data;
};

// Create program - Same API as web app
export const createProgram = async (data: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}): Promise<Program> => {
  const response = await api.post('/programs', data);
  return response.data.data;
};

// Update program - Same API as web app
export const updateProgram = async (id: string, data: {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Program> => {
  const response = await api.put(`/programs/${id}`, data);
  return response.data.data;
};

// Delete program - Same API as web app
export const deleteProgram = async (id: string): Promise<void> => {
  await api.delete(`/programs/${id}`);
};

// Request approval - Same API as web app
export const requestApproval = async (id: string): Promise<Program> => {
  const response = await api.post(`/programs/${id}/request-approval`);
  return response.data.data;
};

// Archive program - Same API as web app
export const archiveProgram = async (id: string): Promise<void> => {
  await api.post(`/programs/${id}/archive`);
}; 