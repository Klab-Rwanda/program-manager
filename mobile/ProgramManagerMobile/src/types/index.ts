// Mobile App Types - Copied from web app

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Program Manager' | 'Facilitator' | 'Trainee' | 'IT-Support';
  status: 'Pending' | 'Active';
  isActive: boolean;
  firstLogin?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trainee extends User {
  phone?: string;
  location?: string;
  enrolledPrograms?: string[];
  progress?: number;
  attendance?: number;
  completedProjects?: number;
  totalProjects?: number;
  joinDate?: string;
  lastActive?: string;
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
  facilitators?: Facilitator[];
  trainees?: Trainee[];
  courses?: Course[];
  isActive: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  program: {
    _id: string;
    name: string;
  };
  facilitator: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  grade: string;
}

export interface Facilitator extends User {
  phone?: string;
  specialization?: string;
  experience?: string;
  programs?: string[];
  rating?: number;
  github?: string;
  joinDate?: string;
  studentsCount?: number;
  contentSubmissions?: number;
  approvedContent?: number;
  type?: string;
  previousProgram?: string;
  promotionDate?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  program: string | { _id: string; name: string; };
  course: string | { _id: string; title: string; };
  roadmap: string | { _id: string; title: string; weekNumber: number; };
  dueDate: string;
  maxGrade: number;
  sentToTrainees?: boolean;
  sentToTraineesAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentSubmission {
  submissionId: string | null;
  traineeName: string;
  traineeEmail: string;
  submittedAt: string | null;
  status: 'Submitted' | 'Reviewed' | 'NeedsRevision' | 'Not Submitted';
  grade: string;
  feedback: string;
  attendancePercentage: number;
  totalSessions: number;
  presentSessions: number;
  hasSubmitted: boolean;
}

export interface AssignmentWithMarks {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  dueDate: string;
  maxGrade: number;
  facilitatorName: string;
  submissions: AssignmentSubmission[];
}

export interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  programId?: {
    _id: string;
    name: string;
  };
  sessionId?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  method: 'geolocation' | 'qr_code' | 'manual' | 'facial_recognition';
  status: 'Present' | 'Absent' | 'Excused' | 'Late';
}

export interface ClassSession {
  _id: string;
  type: 'physical' | 'online';
  programId: {
    _id: string;
    name: string;
  };
  facilitatorId: {
    _id: string;
    name: string;
  };
  sessionId: string;
  title: string;
  description?: string;
  startTime: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  accessLink?: string;
  meetingLink?: string;
  qrCodeImage?: string;
  updatedAt: string;
} 