import api from '../api';
import { Course } from '@/types';

// Facilitator: Create a new course (uploads a file)
export const createCourse = async (formData: FormData): Promise<Course> => {
    const response = await api.post('/courses', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
};

// Facilitator: Fetch all courses they have created
export const getMyCourses = async (): Promise<Course[]> => {
    const response = await api.get('/courses/my-courses');
    return response.data.data;
};

// Facilitator: Request approval for a course
export const requestCourseApproval = async (courseId: string): Promise<Course> => {
    const response = await api.patch(`/courses/${courseId}/request-approval`);
    return response.data.data;
};

// Program Manager: Fetch all courses pending approval
export const getPendingCourses = async (): Promise<Course[]> => {
    const response = await api.get('/courses/pending');
    return response.data.data;
};

// Program Manager: Approve a course
export const approveCourse = async (courseId: string): Promise<Course> => {
    const response = await api.patch(`/courses/${courseId}/approve`);
    return response.data.data;
};

// Program Manager: Reject a course
export const rejectCourse = async (courseId: string, reason: string): Promise<Course> => {
    const response = await api.patch(`/courses/${courseId}/reject`, { reason });
    return response.data.data;
};

// --- NEW FUNCTION FOR TRAINEES ---
// Trainee: Get all APPROVED courses for a specific program
export const getApprovedCoursesForProgram = async (programId: string): Promise<Course[]> => {
    // This uses an existing backend endpoint which returns all courses for a program.
    // The Trainee page will only show courses with status 'Approved'.
    const response = await api.get(`/courses/program/${programId}`);
    return response.data.data;
};

export const updateCourse = async (courseId: string, data: { title: string; description: string }): Promise<Course> => {
    const response = await api.put(`/courses/${courseId}`, data);
    return response.data.data;
};

// Facilitator: Delete a course
export const deleteCourse = async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
};