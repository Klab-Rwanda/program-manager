import api from "../api";
import { Facilitator, Program } from "@/types";

// GET all facilitators
export const getAllFacilitators = async (): Promise<Facilitator[]> => {
  const res = await api.get("/users/manage?role=Facilitator");
  return res.data.data.map((user: any) => ({
    ...user,
    phone: 'N/A',
    specialization: 'Specialization N/A',
    experience: 'N/A',
    status: user.isActive ? 'Active' : 'Inactive',
    programs: user.enrolledPrograms || [],
    joinDate: new Date(user.createdAt).toLocaleDateString(),
  }));
};

// CREATE a new facilitator
export const createFacilitator = async (facilitatorData: { name: string; email: string }): Promise<Facilitator> => {
  const response = await api.post("/auth/register", { ...facilitatorData, role: 'Facilitator' });
  return response.data.data;
};

// ASSIGN a facilitator to a program
export const assignFacilitatorToProgram = async (programId: string, facilitatorId: string): Promise<Program> => {
    const response = await api.post(`/programs/${programId}/enroll-facilitator`, { facilitatorId });
    return response.data.data;
};