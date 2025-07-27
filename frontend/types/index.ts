// ===================================================================
//
//                      MASTER TYPES DEFINITION FILE
//
// This file is the single source of truth for the data shapes
// used throughout the frontend application.
//
// ===================================================================


// -------------------------------------------------------------------
// CORE USER & ROLE TYPES
// -------------------------------------------------------------------

/**
 * Base user object returned from the backend.
 * All other user roles (Trainee, Facilitator) extend this.
 */
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


// ----------------------------
// Facilitator
// ----------------------------
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

// ----------------------------
// Trainee
// ----------------------------
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

// ----------------------------
// Topic & Roadmap
// ----------------------------
export interface Topic {
    _id: string;
    day: string;
    title: string;
    startTime?: string; // e.g., "09:00"
    endTime?: string; // e.g., "12:00"
    duration?: string; // e.g., "3 hours" - kept for backward compatibility
    sessionType: 'in-person' | 'online';
    isCompleted: boolean;
}

export interface Roadmap {
    _id: string;
    program: string | { _id: string; name: string; };
    course: string | { _id: string; title: string; };
    facilitator: string | { _id: string; name: string; email: string; };
    weekNumber: number;
    title: string;
    startDate: string;
    objectives: string[];
    topics: Topic[];
    status?: string;
    feedback?: string;
}


// -------------------------------------------------------------------
// PROGRAM & COURSE TYPES
// -------------------------------------------------------------------

/**
 * Represents a single educational Program.
 * Contains populated fields for related users and courses.
 */
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
  courses?: Course[]; // A program can have an array of courses
  isActive: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a single Course within a Program.
 */
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
  };
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  contentUrl: string; 
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}


// --- NEW TYPES FOR ASSIGNMENT MARKS ---
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

export interface CourseAssignmentsData {
  course: {
    _id: string;
    title: string;
    program: string;
    facilitator: string;
  };
  assignments: AssignmentWithMarks[];
}


/**
 * Represents a project submission from a trainee.
 */
export interface Submission {
    _id: string;
    // Add other submission properties as needed from your backend model
}


// -------------------------------------------------------------------
// STATISTICS & DATA TRANSFER OBJECT (DTO) TYPES
// -------------------------------------------------------------------

/**
 * Shape of the statistics object for a single program.
 * Matches the backend endpoint GET /programs/:id/stats
 */
export interface ProgramStats {
    enrolledTrainees: number;
    attendanceRate: number;
    completionRate: number;
}

/**
 * Data shape for creating a new program.
 */

export interface CreateProgramData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

/**
 * Data shape for updating an existing program.
 */
export interface UpdateProgramData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Shape of the statistics object for the Certificate page.
 */
export interface Certificate {
  id: string;
  traineeName: string;
  traineeEmail: string;
  program: string;
  completionDate: string;
  issueDate: string | null;
  certificateId: string;
  status: string;
  grade: string;
}

/**
* Shape of the template object for the Certificate page.
*/
export interface Template {
  id: number;
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
    roadmap: string | { _id: string; title: string; weekNumber: number; }; // Can be populated
    dueDate: string;
    maxGrade: number;
    sentToTrainees?: boolean;
    sentToTraineesAt?: string;
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

export interface RoadmapAssignmentsData {
    roadmap: {
        _id: string;
        title: string;
        weekNumber: number;
        program: string;
        facilitator: string;
        startDate: string;
        objectives: string[];
    };
    assignments: AssignmentWithMarks[];
}