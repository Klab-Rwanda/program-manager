import api from '../api';
import { Assignment, Course, Program } from '@/types';

// Create a new course with a file upload
export const createCourse = async (data: { title: string; description: string; programId: string; courseDocument: File }): Promise<Course> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('programId', data.programId);
    formData.append('courseDocument', data.courseDocument);

    const response = await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
};

// Get all courses for the logged-in facilitator
export const getMyCourses = async (): Promise<Course[]> => {
    const response = await api.get('/courses/my-courses');
    return response.data.data;
};

// Update a course
export const updateCourse = async (id: string, data: { title: string; description: string }): Promise<Course> => {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data.data;
};

// Delete a course
export const deleteCourse = async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
};

// Get all courses for a specific program ID
export const getCoursesForProgram = async (programId: string): Promise<Course[]> => {
    const response = await api.get(`/courses/program/${programId}`);
    return response.data.data;
};

