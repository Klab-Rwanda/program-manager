import api from '../api';
import { Assignment } from '@/types';

// For Facilitator to get all assignments they created
export const getMyCreatedAssignments = async (): Promise<Assignment[]> => {
    const response = await api.get('/assignments/my-assignments');
    return response.data.data;
};

// For Trainee to get assignments for a specific course
export const getAssignmentsForCourse = async (courseId: string): Promise<Assignment[]> => {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data.data;
};

// For Facilitator to create an assignment
export const createAssignment = async (data: Partial<Assignment>): Promise<Assignment> => {
    const response = await api.post('/assignments', data);
    return response.data.data;
};

// For Facilitator to update an assignment
export const updateAssignment = async (id: string, data: Partial<Assignment>): Promise<Assignment> => {
    const response = await api.patch(`/assignments/${id}`, data);
    return response.data.data;
};

// For Facilitator to delete an assignment
export const deleteAssignment = async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
};

export const getMyAvailableAssignments = async (): Promise<Assignment[]> => {
    const response = await api.get('/assignments/my-available');
    return response.data.data;
};

// For Facilitator to resend assignment notifications to trainees
export const resendAssignmentToTrainees = async (assignmentId: string): Promise<{ success: boolean; sentCount: number; totalCount: number }> => {
    const response = await api.post(`/assignments/${assignmentId}/resend-notifications`);
    return response.data.data;
};

export const getAssignmentsForProgram = async (programId: string): Promise<Assignment[]> => {
    const response = await api.get(`/assignments/program/${programId}`);
    return response.data.data;
};