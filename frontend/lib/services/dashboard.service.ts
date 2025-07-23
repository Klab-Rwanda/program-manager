import api from '../api';
import { User, Program } from '@/types'; // Make sure Program is imported

// Type for the dashboard stats object from the backend
export interface DashboardStats {
  totalPrograms: number;
  activeTrainees: number;
  totalUsers: number;
  pendingApprovals: number;
}

// Type for a single program's stats
export interface ProgramStats {
    totalEnrolled: number;
    totalFacilitators: number;
    overallAttendancePercentage: number;
    totalPresentDays: number;
    totalExcusedDays: number;
    totalEligibleDays: number;
}

export interface FacilitatorStats {
  assignedPrograms: number;
  todaysSessions: number;
  pendingReviews: number;
  attendanceRate: number;
  totalStudents: number;
}

interface PaginatedUsers {
  data: User[];
  // Add other pagination fields if your backend sends them
}

// Type for the user detail object from the backend
export interface UserDetails extends User {
  programs: Array<{ name: string }>;
  activityFeed: Array<{
    id: string;
    type: string;
    text: string;
    timestamp: string;
  }>;
}

// --- EXISTING FUNCTIONS (KEEP THESE) ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data.data;
};

export const getOnboardedUsers = async (limit: number = 5): Promise<User[]> => {
  const response = await api.get(`/users/manage/onboarded?limit=${limit}`);
  return response.data.data.data;
};

export const getAvailableManagers = async (): Promise<User[]> => {
    const response = await api.get('/users/manage/list-by-role?role=Program Manager');
    return response.data.data;
};

export const getDetailedUser = async (userId: string): Promise<UserDetails> => {
    const response = await api.get(`/users/manage/${userId}`);
    return response.data.data;
};

// --- NEW FUNCTIONS FOR PROGRAM MANAGER ---

// Fetches programs managed by the current logged-in user.
// The backend's /programs endpoint automatically filters by role.
export const getMyManagedPrograms = async (): Promise<Program[]> => {
    const response = await api.get('/programs');
    return response.data.data;
};

// Fetches detailed statistics for a single program.
export const getProgramStats = async (programId: string): Promise<ProgramStats> => {
    const response = await api.get(`/programs/${programId}/stats`);
    return response.data.data;
};
export const getFacilitatorDashboardStats = async (): Promise<FacilitatorStats> => {
  const response = await api.get('/dashboard/facilitator-stats');
  return response.data.data;
};