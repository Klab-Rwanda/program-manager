import api from '../api';
import { User } from '@/types/user';

interface LoginResponse {
  user: User;
  accessToken: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  // The backend wraps data in a `data` property, so we access response.data.data
  return response.data.data; 
};