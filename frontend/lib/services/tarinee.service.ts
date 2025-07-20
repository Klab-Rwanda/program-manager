
import api from "../api";
import { Trainee } from "@/types";

// GET all trainees (you already have this)
export const getAllTrainees = async (): Promise<Trainee[]> => {
  const res = await api.get("/users/manage?role=trainee");
  return res.data.data;
};
export const getTraineeById = async (id: string): Promise<Trainee> => {
  const res = await api.get(`/users/manage/${id}`);
  return res.data.data;
};

export const createTrainee = async (trainee: Partial<Trainee>): Promise<Trainee> => {
  const res = await api.post("/users/manage", trainee);
  return res.data.data;
};

// ✅ UPDATE trainee
export const updateTrainee = async (id: string, trainee: Partial<Trainee>): Promise<Trainee> => {
  const res = await api.put(`/users/manage/${id}`, trainee);
  return res.data.data;
};

// ✅ DELETE trainee
export const deleteTrainee = async (id: string): Promise<void> => {
  await api.delete(`/users/manage/${id}`);
};
