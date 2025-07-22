import api from '../api';
import { Course } from '@/types';

// Get all courses for a specific program
export const getCoursesForProgram = async (programId: string): Promise<Course[]> => {
  if (!programId) return []; // Prevent API call if no program is selected
  const response = await api.get(`/courses/program/${programId}`);
  return response.data.data;
};

// NEW: Create a new course with a file upload for a facilitator
export const createCourse = async (
    title: string,
    description: string,
    programId: string,
    courseDocument: File
): Promise<Course> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('programId', programId);
    formData.append('courseDocument', courseDocument);

    const response = await api.post('/courses', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
};