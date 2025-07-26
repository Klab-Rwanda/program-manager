import api from '../api';
import { Roadmap } from '@/types';

export const getMyRoadmaps = async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps/my-roadmaps');
    return response.data.data;
};

// Creates OR updates a roadmap. The backend handles the logic.
export const saveRoadmap = async (data: any): Promise<Roadmap> => {
    // The same endpoint handles create and update
    const response = await api.post('/roadmaps', data);
    return response.data.data;
};

// Deletes an entire roadmap and its topics
export const deleteRoadmap = async (id: string): Promise<void> => {
    await api.delete(`/roadmaps/${id}`);
};

export const createRoadmap = async (data: any): Promise<Roadmap> => {
    const response = await api.post('/roadmaps', data);
    return response.data.data;
};

// Get all roadmaps
export const getAllRoadmaps = async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps/all');
    return response.data.data;
};

// Get pending approval roadmaps (for Program Manager)
export const getPendingApprovalRoadmaps = async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps/pending-approval');
    return response.data.data;
};

// Get roadmaps by course ID
export const getRoadmapsByCourse = async (courseId: string): Promise<any> => {
    const response = await api.get(`/roadmaps/course/${courseId}`);
    return response.data.data;
};

// Get assignments with marks for a specific roadmap
export const getRoadmapAssignmentsWithMarks = async (roadmapId: string): Promise<any> => {
    const response = await api.get(`/roadmaps/${roadmapId}/assignments-with-marks`);
    return response.data.data;
};

// Approve a roadmap
export const approveRoadmap = async (roadmapId: string): Promise<any> => {
    const response = await api.patch(`/roadmaps/${roadmapId}/approve`);
    return response.data.data;
};

// Reject a roadmap
export const rejectRoadmap = async (roadmapId: string, feedback: string): Promise<any> => {
    const response = await api.patch(`/roadmaps/${roadmapId}/reject`, { feedback });
    return response.data.data;
};

// Get approved roadmaps for facilitator (for assignment creation)
export const getApprovedRoadmaps = async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps/my-roadmaps');
    // Filter for approved roadmaps on the frontend
    const allRoadmaps = response.data.data;
    return allRoadmaps.filter((roadmap: Roadmap) => roadmap.status === 'approved');
};