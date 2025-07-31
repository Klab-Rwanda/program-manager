// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SuperAdmin' | 'Program Manager' | 'Facilitator' | 'Trainee' | 'ItSupport';
  phone?: string;
  avatar?: string;
  department?: string;
  joinDate: string;
}

// Program types
export interface Program {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  progress?: number;
  trainees?: User[];
  facilitators?: User[];
  courses?: Course[];
  totalAssignments?: number;
  completedAssignments?: number;
  averageScore?: number;
  lastActivity?: string;
}

// Course types
export interface Course {
  _id: string;
  name: string;
  description: string;
  duration: string;
  status: 'active' | 'completed' | 'pending';
  roadmap?: Roadmap[];
}

// Roadmap types
export interface Roadmap {
  _id: string;
  name: string;
  description: string;
  course: string | Course;
  status: 'active' | 'completed' | 'pending';
  progress?: number;
}

// Assignment types
export interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: string | Course;
  roadmap: string | Roadmap;
  dueDate: string;
  status: 'active' | 'completed' | 'pending';
  sentToTrainees?: boolean;
  sentToTraineesAt?: string;
  submissions?: Submission[];
}

// Submission types
export interface Submission {
  _id: string;
  assignment: string | Assignment;
  trainee: string | User;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'late';
  marks?: number;
  feedback?: string;
}

// Attendance types
export interface Attendance {
  _id: string;
  trainee: string | User;
  program: string | Program;
  date: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  checkOutTime?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  qrCode?: string;
}

// Notification types
export interface Notification {
  _id: string;
  user: string | User;
  title: string;
  message: string;
  type: 'assignment' | 'attendance' | 'program' | 'general';
  read: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  role?: string;
}

// Dashboard stats types
export interface DashboardStats {
  totalPrograms: number;
  activePrograms: number;
  totalTrainees: number;
  totalAssignments: number;
  completedAssignments: number;
  averageAttendance: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  _id: string;
  type: 'assignment' | 'attendance' | 'program' | 'submission';
  title: string;
  description: string;
  timestamp: string;
  user?: User;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface AssignmentForm {
  title: string;
  description: string;
  courseId: string;
  roadmapId: string;
  dueDate: string;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TraineeDashboard: undefined;
  AttendanceScreen: undefined;
  ProgramsScreen: undefined;
  AssignmentsScreen: undefined;
  ProfileScreen: undefined;
  ManagerDashboard: undefined;
  ApprovalsScreen: undefined;
};

export type TraineeTabParamList = {
  TraineeDashboard: undefined;
  AttendanceScreen: undefined;
  ProgramsScreen: undefined;
  AssignmentsScreen: undefined;
  ProfileScreen: undefined;
};

export type ManagerTabParamList = {
  ManagerDashboard: undefined;
  ProgramsScreen: undefined;
  ApprovalsScreen: undefined;
  ProfileScreen: undefined;
};