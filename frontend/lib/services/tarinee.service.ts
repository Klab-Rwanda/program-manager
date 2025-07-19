import api from "../api";
import { Trainee } from "@/types";

export const getAllTrainees = async (): Promise<Trainee[]> => {
  const res = await api.get("/users/manage?role=trainee");
  return res.data.data;
};

export const getTraineeById = async (id: string): Promise<Trainee> => {
  const res = await api.get(`/users/manage/${id}`);
  return res.data.data;
};
