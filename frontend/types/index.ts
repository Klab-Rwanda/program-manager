// ----------------------------
// User
// ----------------------------
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Program Manager' | 'Facilitator' | 'Trainee' | 'it_support';
  status: 'Pending' | 'Active';
  isActive: boolean;
  firstLogin?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------
// Facilitator
// ----------------------------
export interface Facilitator {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  status: 'Active' | 'Inactive' | 'Pending';
  programs: string[]; // Array of program IDs
  rating: number;
  github: string;
  joinDate: string;
  studentsCount: number;
  contentSubmissions: number;
  approvedContent: number;
  type: string;
  previousProgram?: string;
  promotionDate?: string;
}


export interface Trainee extends User {
  program: string;
  completionDate: string | number | Date;
  attendanceRate: number;
  finalScore: number;
  phone: string;
  location: string;
  enrolledPrograms: string[]; // Array of program IDs
  progress: number;
  attendance: number;
  completedProjects: number;
  totalProjects: number;
  joinDate: string;
  lastActive: string;
}


export interface Program {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'PendingApproval' | 'Active' | 'Completed' | 'Rejected';
  rejectionReason?: string;
  programManager?: {
    _id: string;
    name: string;
    email: string;
  };
  facilitators?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  trainees?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  departments?: Array<{
    _id: string;
    name: string;
  }>;
  isActive: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}


export interface ContentSubmission {
  _id: string;
  facilitatorName: string;
  program: string;
  title: string;
  description: string;
  submissionDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  duration: string;
  content?: string;
  fileUrl?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  program: string; // Program ID
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  facilitatorId: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}


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


export interface Certificate {
  id: number
  traineeName: string
  traineeEmail: string
  program: string
  completionDate: string
  issueDate: string | null
  certificateId: string
  status: string
  grade: string
  finalScore: number
  attendanceRate: number
  templateId: number
}

export interface Template {
  id: number
  name: string
  description: string
  isDefault: boolean
  style: string
  colorScheme: string
}

export interface Student extends Trainee {
  id: number
  name: string
  email: string
  program: string
  finalScore: number
  attendanceRate: number
  completionDate: string
  isEligible: boolean
}