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
  role: 'SuperAdmin' | 'Program Manager' | 'Facilitator' | 'Trainee' | 'it_support';
  status: 'Pending' | 'Active';
  isActive: boolean;
  firstLogin?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a Facilitator, extending the base User.
 * Includes additional fields specific to facilitators.
 */
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
}

/**
 * Represents a Trainee, extending the base User.
 * Includes additional fields specific to trainees.
 */
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
  isDefault: boolean;
  style: string;
  colorScheme: string;
}