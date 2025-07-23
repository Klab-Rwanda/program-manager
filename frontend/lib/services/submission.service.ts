import api from '../api';
import { Submission } from '@/types';

// --- EXISTING FUNCTIONS (Keep these) ---
export const createSubmission = async (
  programId: string,
  courseId: string,
  projectFile: File
): Promise<Submission> => {
  const formData = new FormData();
  formData.append('programId', programId);
  formData.append('courseId', courseId);
  formData.append('projectFile', projectFile);

  const response = await api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const getSubmissionsForCourse = async (courseId: string): Promise<Submission[]> => {
  const response = await api.get(`/submissions/course/${courseId}`);
  return response.data.data;
};

export const reviewSubmission = async (
  submissionId: string,
  reviewData: { status: 'Reviewed' | 'NeedsRevision'; feedback: string; grade: string; }
): Promise<Submission> => {
  const response = await api.patch(`/submissions/${submissionId}/review`, reviewData);
  return response.data.data;
};

export const getMySubmissions = async (): Promise<Submission[]> => {
    // This is for trainees
    try {
      const response = await api.get('/submissions/my-submissions');
      return response.data.data;
    } catch (e) {
      console.warn("Backend endpoint /submissions/my-submissions is not yet implemented.");
      return [];
    }
};

// --- NEW FUNCTION FOR FACILITATOR DASHBOARD ---

// Fetches all submissions across all of the facilitator's managed courses that are pending.
export const getPendingSubmissionsForFacilitator = async (): Promise<Submission[]> => {
  const response = await api.get('/submissions/facilitator/pending');
  return response.data.data;
};

export const getManagedSubmissions = async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/managed-programs');
    return response.data.data;
};