// src/types/index.ts

// Based on your user.model.js
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Trainee' | 'Facilitator' | 'Program Manager' | 'SuperAdmin';
  status: 'Pending' | 'Active';
  isActive: boolean;
  firstLogin?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Based on your program.model.js
export interface Program {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  programManagers: User[]; // This was programManager in your model, but let's use the plural from the frontend code
  facilitators: User[];
  trainees: User[];
  status: 'Draft' | 'PendingApproval' | 'Active' | 'Completed' | 'Rejected';
  isActive: boolean;
  category: string; // Add this as it's used in the frontend
  createdAt: string;
  updatedAt: string;
}

// Add other interfaces for Course, Attendance, etc. as you integrate them.