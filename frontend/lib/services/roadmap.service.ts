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