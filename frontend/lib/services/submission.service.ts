import api from '../api';
import { Submission } from '@/types';

// --- EXISTING FUNCTIONS (Keep these) ---
export const createSubmission = async (
  assignmentId: string, // Changed to assignmentId
  file: File
): Promise<Submission> => {
  const formData = new FormData();
  formData.append('assignmentId', assignmentId); // Changed to assignmentId
  formData.append('projectFile', file); // Ensure this matches backend multer field name

  const response = await api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

// Renamed from getSubmissionsForCourse, now gets all submissions relevant to a facilitator
export const getSubmissionsForFacilitator = async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/facilitator');
    return response.data.data;
};


export const reviewSubmission = async (
  submissionId: string,
  reviewData: { status: 'Reviewed' | 'NeedsRevision'; feedback: string; grade: string | number; } // Allow string or number for grade
): Promise<Submission> => {
  const response = await api.patch(`/submissions/${submissionId}/review`, reviewData);
  return response.data.data;
};

export const getMySubmissions = async (): Promise<Submission[]> => {
    // This is for trainees
    const response = await api.get('/submissions/my-submissions');
    return response.data.data;
};

// --- Removed functions that are no longer used or replaced ---
/*
export const getPendingSubmissionsForFacilitator = async (): Promise<Submission[]> => {
  const response = await api.get('/submissions/facilitator/pending');
  return response.data.data;
};

export const getManagedSubmissions = async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/managed-programs');
    return response.data.data;
};
*/