import api from "../api";
import { Certificate, Program, Student, Template } from "@/types/index";

// ✅ 1. Fetch all issued certificates
export const fetchCertificates = async (): Promise<Certificate[]> => {
  const res = await api.get("/certificates");
  return res.data.data;
};

// ✅ 2. Fetch certificate templates
export const fetchTemplates = async (): Promise<Template[]> => {
  const res = await api.get("/certificates/templates");
  return res.data.data;
};

// ✅ 3. Fetch eligible trainees (from /certificates/eligible-students)
export const fetchEligibleTrainees = async (): Promise<Student[]> => {
  const res = await api.get("/certificates/eligible-students");
  return res.data.data;
};

// ✅ 4. Fetch all programs
export const fetchPrograms = async (): Promise<Program[]> => {
  const res = await api.get("/programs");
  return res.data.data;
};

// ✅ 5. Issue certificates to multiple trainees (loop + call /certificates/issue)
export const issueCertificatesToTrainees = async (
  traineeIds: string[],
  programId: string
): Promise<void> => {
  for (const traineeId of traineeIds) {
    await api.post("/certificates/issue", {
      traineeId,
      programId
    });
  }
};
