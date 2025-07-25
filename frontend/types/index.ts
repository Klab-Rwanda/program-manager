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

// ... other types

export interface Topic {
    _id: string;
    day: string;
    title: string;
    duration: string;
    sessionType: 'in-person' | 'online';
    isCompleted: boolean;
}

export interface Roadmap {
    _id: string;
    program: string | { _id: string; name: string; };
    weekNumber: number;
    title: string;
    startDate: string;
    objectives: string[];
    topics: Topic[];
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
  // The backend populates these, so they should be objects, not just strings
  program: {
    _id: string;
    name: string;
  };
  facilitator: {
    _id: string;
    name: string;
  };
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  
  // --- ADD THIS REQUIRED PROPERTY ---
  contentUrl: string; 

  // --- ADD THIS OPTIONAL PROPERTY ---
  rejectionReason?: string;
  
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

// types/ticket.ts

export interface Comment {
  _id: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolution?: string;
  comments: Comment[];
}


export interface AttendanceRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        role?: string; // Optional for when it's populated
    };
    programId?: { // Make programId an object since it will be populated
        _id: string;
        name: string;
    };
    sessionId?: string; // Optional
    date: string;
    checkIn?: string;
    checkOut?: string;
    method: 'geolocation' | 'qr_code' | 'manual' | 'facial_recognition';
    status: 'Present' | 'Absent' | 'Excused' | 'Late';
}

export interface Program {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'PendingApproval' | 'Active' | 'Completed' | 'Rejected';
  programManager?: {
    _id: string;
    name: string;
    email: string;
  };
  facilitators?: Facilitator[];
  trainees?: Trainee[];
  updatedAt: string;
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
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  accessLink?: string;
  meetingLink?: string;
  qrCodeImage?: string; // This is a frontend-only convenience field, not in DB model
  updatedAt: string;
}


// ... other types

export interface Assignment {
    _id: string;
    title: string;
    description: string;
    program: string | { _id: string; name: string; }; // Can be populated
    course: string | { _id: string; title: string; }; // Can be populated
    dueDate: string;
    maxGrade: number;
    createdAt?: string;
    updatedAt?: string;
}
// --- ATTENDANCE TYPES ---

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