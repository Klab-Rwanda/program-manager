import api from '../api';
import { Project, ProjectUpdate, ProjectUpdatesResponse, ProjectTask, CreateTaskData } from '@/types';

// ============== Project CRUD (Facilitator/PM) ==============

export const createProject = async (formData: FormData): Promise<Project> => {
    const response = await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
};

export const getProjects = async (params?: {
    program?: string;
    status?: string;
}): Promise<Project[]> => {
    const response = await api.get('/projects', { params });
    return response.data.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
};

export const updateProject = async (id: string, formData: FormData): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
};

export const deleteProject = async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
};

export const removeProjectFile = async (projectId: string, fileIndex: number): Promise<Project> => {
    const response = await api.delete(`/projects/${projectId}/files/${fileIndex}`);
    return response.data.data;
};

// ============== Trainee: My Projects ==============

export const getMyProjects = async (params?: {
    status?: string;
}): Promise<Project[]> => {
    const response = await api.get('/projects/my-projects', { params });
    return response.data.data;
};

// ============== Project Updates (Trainee) ==============

export const createProjectUpdate = async (projectId: string, data: {
    description: string;
    completionPercentage?: number;
    blockers?: string;
}): Promise<ProjectUpdate> => {
    const response = await api.post(`/projects/${projectId}/updates`, data);
    return response.data.data;
};

export const editProjectUpdate = async (updateId: string, data: {
    description?: string;
    completionPercentage?: number;
    blockers?: string;
}): Promise<ProjectUpdate> => {
    const response = await api.put(`/projects/updates/${updateId}`, data);
    return response.data.data;
};

export const getMyProjectUpdates = async (projectId: string, params?: {
    limit?: number;
}): Promise<ProjectUpdate[]> => {
    const response = await api.get(`/projects/${projectId}/my-updates`, { params });
    return response.data.data;
};

export const getTodayProjectUpdate = async (projectId: string): Promise<ProjectUpdate | null> => {
    const response = await api.get(`/projects/${projectId}/today-update`);
    return response.data.data;
};

// ============== Project Updates (Facilitator/PM) ==============

export const getProjectUpdates = async (projectId: string, params?: {
    trainee?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
}): Promise<ProjectUpdatesResponse> => {
    const response = await api.get(`/projects/${projectId}/updates`, { params });
    return response.data.data;
};

export const reviewProjectUpdate = async (updateId: string, reviewComment?: string): Promise<ProjectUpdate> => {
    const response = await api.patch(`/projects/updates/${updateId}/review`, { reviewComment });
    return response.data.data;
};

// ============== Project Tasks ==============

export const createTask = async (projectId: string, data: CreateTaskData): Promise<ProjectTask> => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data.data;
};

export const getProjectTasks = async (projectId: string, params?: {
    assignedTo?: string;
}): Promise<ProjectTask[]> => {
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data.data;
};

export const getMyTasks = async (projectId: string): Promise<ProjectTask[]> => {
    const response = await api.get(`/projects/${projectId}/my-tasks`);
    return response.data.data;
};

export const updateTaskCompletion = async (taskId: string, completionPercentage: number, comment?: string): Promise<ProjectTask> => {
    const response = await api.patch(`/projects/tasks/${taskId}/completion`, {
        completionPercentage,
        ...(comment ? { comment } : {})
    });
    return response.data.data;
};

export const updateTask = async (taskId: string, data: Partial<CreateTaskData>): Promise<ProjectTask> => {
    const response = await api.put(`/projects/tasks/${taskId}`, data);
    return response.data.data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    await api.delete(`/projects/tasks/${taskId}`);
};
