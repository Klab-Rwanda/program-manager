import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.65:8000/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
                     const token = await AsyncStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting token from storage:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
                 if (error.response?.status === 401) {
           // Token expired or invalid
           await AsyncStorage.removeItem('accessToken');
           await AsyncStorage.removeItem('user');
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response;
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    return response.data;
  }

     async logout() {
     await AsyncStorage.removeItem('accessToken');
     await AsyncStorage.removeItem('user');
   }

  async getCurrentUser() {
    const response = await this.get('/auth/me');
    return response.data;
  }

  // Program methods
  async getPrograms() {
    const response = await this.get('/programs');
    return response.data;
  }

  async getProgramById(id: string) {
    const response = await this.get(`/programs/${id}`);
    return response.data;
  }

  async getMyPrograms() {
    const response = await this.get('/programs');
    return response.data;
  }

  // Assignment methods
  async getAssignments() {
    const response = await this.get('/assignments');
    return response.data;
  }

  async getAssignmentById(id: string) {
    const response = await this.get(`/assignments/${id}`);
    return response.data;
  }

  async getMyAssignments() {
    const response = await this.get('/assignments/my-available');
    return response.data;
  }

  async submitAssignment(assignmentId: string, content: string) {
    const response = await this.post(`/assignments/${assignmentId}/submit`, { content });
    return response.data;
  }

  // Attendance methods
  async markAttendance(data: {
    programId: string;
    status: 'present' | 'absent' | 'late';
    location?: { latitude: number; longitude: number };
    qrCode?: string;
  }) {
    const response = await this.post('/attendance/mark', data);
    return response.data;
  }

  async getAttendanceHistory() {
    const response = await this.get('/attendance/my-history');
    return response.data;
  }

  // Dashboard methods
  async getDashboardStats() {
    const response = await this.get('/dashboard/stats');
    return response.data;
  }

  async getRecentActivity() {
    const response = await this.get('/dashboard/recent-activity');
    return response.data;
  }

  // Course methods
  async getCourses() {
    const response = await this.get('/courses');
    return response.data;
  }

  async getCourseById(id: string) {
    const response = await this.get(`/courses/${id}`);
    return response.data;
  }

  // Roadmap methods
  async getRoadmaps() {
    const response = await this.get('/roadmaps');
    return response.data;
  }

  async getRoadmapById(id: string) {
    const response = await this.get(`/roadmaps/${id}`);
    return response.data;
  }

  // Notification methods
  async getNotifications() {
    const response = await this.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.put(`/notifications/${id}/read`);
    return response.data;
  }

  // Profile methods
  async updateProfile(data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    department: string;
  }>) {
    const response = await this.put('/profile', data);
    return response.data;
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    const response = await this.put('/profile/change-password', data);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;