import api from '../api';
import { Program } from '@/types';
import { ProgramStats } from './dashboard.service'; // Ensure this path is correct if ProgramStats is here

export interface CreateProgramData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProgramData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// Get all programs for the current user (filtered by backend role)
export const getAllPrograms = async (): Promise<Program[]> => {
  const response = await api.get('/programs');
  return response.data.data;
};

// Get a single program by ID
export const getProgramById = async (id: string): Promise<Program> => {
  const response = await api.get(`/programs/${id}`);
  return response.data.data;
};

// Create a new program
export const createProgram = async (data: CreateProgramData): Promise<Program> => {
  const response = await api.post('/programs', data);
  return response.data.data;
};

// Update a program
export const updateProgram = async (id: string, data: UpdateProgramData): Promise<Program> => {
  const response = await api.put(`/programs/${id}`, data);
  return response.data.data;
};

// Delete (soft-delete) a program
export const deleteProgram = async (id: string): Promise<void> => {
  console.log("=== API DELETE DEBUG ===");
  console.log("Deleting program with ID:", id);
  console.log("API URL:", `/programs/${id}`);
  console.log("Full URL:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/programs/${id}`);
  
  try {
    const response = await api.delete(`/programs/${id}`);
    console.log("Delete response:", response);
    console.log("=========================");
  } catch (error: any) {
    console.error("=== API DELETE ERROR ===");
    console.error("Error:", error);
    console.error("Error response:", error.response);
    console.error("=========================");
    throw error;
  }
};

// Request approval for a program
export const requestApproval = async (id: string): Promise<Program> => {
  const response = await api.patch(`/programs/${id}/request-approval`);
  return response.data.data;
};

// Approve a program (SuperAdmin only)
export const approveProgram = async (id: string): Promise<Program> => {
  const response = await api.patch(`/programs/${id}/approve`);
  return response.data.data;
};

// Reject a program (SuperAdmin only)
export const rejectProgram = async (id: string, reason: string): Promise<Program> => {
  const response = await api.patch(`/programs/${id}/reject`, { reason });
  return response.data.data;
};

// Enroll a trainee in a program
export const enrollTrainee = async (programId: string, traineeId: string): Promise<Program> => {
  const response = await api.post(`/programs/${programId}/enroll-trainee`, { traineeId });
  return response.data.data;
};

// Enroll a facilitator in a program
export const enrollFacilitator = async (programId: string, facilitatorId: string): Promise<Program> => {
  const response = await api.post(`/programs/${programId}/enroll-facilitator`, { facilitatorId });
  return response.data.data;
};

// Generate program report PDF
export const generateProgramReport = async (id: string): Promise<Blob> => {
  const response = await api.get(`/programs/${id}/report/pdf`, {
    responseType: 'blob'
  });
  return response.data;
}; 

// Get program statistics
export const getProgramStats = async (id: string): Promise<ProgramStats | null> => {
    try {
        const response = await api.get(`/programs/${id}/stats`);
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch stats for program ${id}:`, error);
        return null;
    }
};

// Assign/Unassign Program Manager
export const assignManagerToProgram = async (programId: string, managerId: string): Promise<Program> => {
    const response = await api.patch(`/programs/${programId}/assign-manager`, { managerId });
    return response.data.data;
};

// Mark program as completed
export const markProgramAsCompleted = async (programId: string): Promise<Program> => {
    const response = await api.patch(`/programs/${programId}/complete`);
    return response.data.data;
};

export const reactivateProgram = async (id: string, newEndDate: string): Promise<Program> => {
  const response = await api.patch(`/programs/${id}/reactivate`, { newEndDate });
  return response.data.data;
};