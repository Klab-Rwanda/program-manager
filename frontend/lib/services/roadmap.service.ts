import api from '../api';

export interface DailyTopic {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    topic: string;
    completed: boolean;
    type: 'in-person' | 'online';
    duration?: string;
}

export interface RoadmapWeek {
    _id: string;
    program: string; // Program ID
    weekNumber: number;
    title: string;
    startDate: string;
    objectives: string[];
    topics: DailyTopic[];
}

// Type for creating a new plan
export interface CreateRoadmapData {
    program: string;
    weekNumber: number;
    title: string;
    startDate: string;
    objectives: string[];
    topics: Omit<DailyTopic, 'completed'>[];
}

export const createWeekPlan = async (data: CreateRoadmapData): Promise<RoadmapWeek> => {
    const response = await api.post('/roadmaps', data);
    return response.data.data;
};

export const getProgramRoadmap = async (programId: string): Promise<RoadmapWeek[]> => {
    const response = await api.get(`/roadmaps/program/${programId}`);
    return response.data.data;
};