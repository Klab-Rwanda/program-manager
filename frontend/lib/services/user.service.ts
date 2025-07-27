import api from '../api';
import { User } from '@/types';

// Fetch all active or archived users
export const getUsers = async (isActive: boolean = true): Promise<User[]> => {
  const endpoint = isActive ? '/users/manage' : '/users/manage/archived';
  const response = await api.get(endpoint);
  return response.data.data;
};

// Create a new user (Admin/Manager action)
export const createUser = async (userData: { name: string; email: string; role: string }): Promise<User> => {
  const response = await api.post('/auth/register', userData);
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