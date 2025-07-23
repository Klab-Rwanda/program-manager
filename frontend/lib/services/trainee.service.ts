import api from "../api";
import { Trainee, Program } from "@/types";

export const getAllTrainees = async (): Promise<Trainee[]> => {
  const res = await api.get("/users/manage?role=Trainee"); // Corrected role string
  // Map backend user data to frontend trainee type with mock details for now
  return res.data.data.map((user: any) => ({
    ...user,
    phone: user.phone || 'N/A',
    location: user.location || 'N/A',
    enrolledPrograms: user.enrolledPrograms || [],
    progress: Math.floor(40 + Math.random() * 60),
    attendance: Math.floor(80 + Math.random() * 20),
    completedProjects: Math.floor(Math.random() * 5),
    totalProjects: 5,
    joinDate: new Date(user.createdAt).toLocaleDateString(),
    lastActive: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
  }));
};

// CREATE a new trainee (for Program Manager)
export const createTrainee = async (traineeData: { name: string; email: string }): Promise<Trainee> => {
  const response = await api.post("/auth/register", { ...traineeData, role: 'Trainee' });
  return response.data.data;
};

// ASSIGN a trainee to a program
export const assignTraineeToProgram = async (programId: string, traineeId: string): Promise<Program> => {
  const response = await api.post(`/programs/${programId}/enroll-trainee`, { traineeId });
  return response.data.data;
};