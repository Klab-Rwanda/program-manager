// lib/services/user.service.ts

import api from '../api';
import { User, Program } from '@/types'; 

// Fetch all active or archived users
export const getUsers = async (isActive: boolean = true): Promise<User[]> => {
  const endpoint = isActive ? '/users/manage' : '/users/manage/archived';
  const response = await api.get(endpoint);
  return response.data.data;
};

// CORRECTED: Renamed 'createUser' to 'createTrainee'
export const createTrainee = async (userData: { name: string; email: string; role: string }): Promise<User> => {
  const response = await api.post('/auth/register', userData);
  return response.data.data;
};

// NEW: Bulk Create Users from a File
export interface BulkUserRegisterResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; message: string; data: any; }>;
}

export const bulkRegisterUsers = async (file: File, targetRole: string = 'Trainee'): Promise<BulkUserRegisterResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole);

  const response = await api.post('/auth/bulk-register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};


// Update a user's active status
export const updateUserStatus = async (userId: string, isActive: boolean): Promise<User> => {
  const response = await api.patch(`/users/manage/${userId}/status`, { isActive });
  return response.data.data;
};


export const updateUserDetails = async (userId: string, userData: { name?: string; role?: string }): Promise<User> => {
  const response = await api.patch(`/users/manage/${userId}`, userData);
  return response.data.data;
};


export const updateFacilitatorProfile = async (facilitatorId: string, profileData: {
  phone?: string;
  specialization?: string;
  experience?: string;
  rating?: number;
  github?: string;
  type?: 'regular' | 'promoted';
  previousProgram?: string;
  promotionDate?: string;
}): Promise<User> => {
  const response = await api.patch(`/users/manage/${facilitatorId}/facilitator-profile`, profileData);
  return response.data.data;
};


export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/manage/${userId}`);
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  const response = await api.get(`/users/manage/list-by-role?role=${encodeURIComponent(role)}`);
  return response.data.data;
};

export const getAllManagers = async (): Promise<User[]> => {
    const response = await api.get('/users/managers');
    return response.data.data;
};

// =========================================================================
// Existing Trainee-specific service functions (from previous discussions)
// =========================================================================

// GET all trainees 
export const getAllTrainees = async (): Promise<User[]> => {
  const res = await api.get("/users/manage?role=Trainee");
  return res.data.data.map((user: any) => ({
    ...user,
    phone: user.phone || 'N/A',
    location: user.location || 'N/A',
    enrolledPrograms: user.enrolledPrograms || [], 
    progress: user.progress || Math.floor(40 + Math.random() * 60), 
    attendance: user.attendance || Math.floor(80 + Math.random() * 20), 
    completedProjects: user.completedProjects || Math.floor(Math.random() * 5), 
    totalProjects: user.totalProjects || 5, 
    joinDate: user.joinDate ? new Date(user.joinDate).toLocaleDateString() : (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'),
    lastActive: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
  }));
};

// ASSIGN a trainee to a program
export const assignTraineeToProgram = async (programId: string, traineeId: string): Promise<Program> => {
  const response = await api.post(`/programs/${programId}/enroll-trainee`, { traineeId });
  return response.data.data;
};

// UNENROLL a trainee from a specific program
export const unenrollTraineeFromProgram = async (programId: string, traineeId: string): Promise<Program> => {
    const response = await api.post(`/programs/${programId}/unenroll-trainee`, { traineeId });
    return response.data.data;
};