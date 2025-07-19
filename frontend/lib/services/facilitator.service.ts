import api from "../api";
import { User } from "@/types/";

export const getAllFacilitators = async (): Promise<User[]> => {
  const res = await api.get("/users/manage?role=Facilitator");
  return res.data.data;
};

export const getFacilitatorById = async (id: string): Promise<User> => {
  const res = await api.get(`/users/manage/${id}`);
  return res.data.data;
};

export const deactivateFacilitator = async (id: string): Promise<User> => {
  const res = await api.patch(`/users/manage/${id}/status`, { isActive: false });
  return res.data.data;
};

export const reactivateFacilitator = async (id: string): Promise<User> => {
  const res = await api.patch(`/users/manage/${id}/status`, { isActive: true });
  return res.data.data;
};
