import api from '../api';

export interface ArchivedProgram {
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
  createdAt: string;
  updatedAt: string;
}

// Get all archived programs
export const getArchivedPrograms = async (): Promise<ArchivedProgram[]> => {
  const response = await api.get('/programs/archived');
  return response.data.data;
};

// Archive a program
export const archiveProgram = async (id: string): Promise<ArchivedProgram> => {
  const response = await api.patch(`/programs/${id}/archive`);
  return response.data.data;
};

// Unarchive a program
export const unarchiveProgram = async (id: string): Promise<ArchivedProgram> => {
  const response = await api.patch(`/programs/${id}/unarchive`);
  return response.data.data;
};

// Transform archived program to archive item format
export const transformToArchiveItem = (program: ArchivedProgram) => {
  return {
    id: program._id,
    type: "program",
    name: program.name,
    description: program.description,
    completionDate: program.endDate,
    participants: program.trainees?.length || 0,
    successRate: 85, // This would need to be calculated from actual data
    duration: `${Math.ceil((new Date(program.endDate).getTime() - new Date(program.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`,
    facilitator: program.facilitators?.[0]?.name || 'Not assigned',
    curriculum: [
      "Core Curriculum",
      "Practical Sessions",
      "Project Work",
      "Assessment"
    ],
    demographics: {
      ageRange: "18-35 years",
      gender: "Mixed",
      education: "Various levels",
      background: "Diverse backgrounds",
    },
    funding: {
      sponsor: "Internal",
      budget: "$25,000",
      scholarships: program.trainees?.length || 0,
    },
    outcomes: {
      employed: Math.floor((program.trainees?.length || 0) * 0.8),
      avgSalary: "$600/month",
      certifications: ["Program Completion Certificate"],
      projects: 3,
    },
    keyMetrics: {
      attendanceRate: 90,
      projectCompletionRate: 85,
      employmentRate: 80,
      satisfactionScore: 4.5,
    },
    tools: ["Standard Tools", "Learning Platform", "Assessment Tools"],
    location: "Kigali, Rwanda",
    cohort: `Cohort ${new Date(program.startDate).getFullYear()}`,
  };
}; 