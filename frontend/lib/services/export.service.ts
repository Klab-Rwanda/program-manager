import api from '../api';

// Existing imports
import { ProgramAttendanceReportData } from './attendance.service'; 

// Export all programs as PDF
export const exportProgramsPDF = async (): Promise<Blob> => {
  const response = await api.get('/export/programs/pdf', {
    responseType: 'blob'
  });
  return response.data;
};

// Export all programs as Excel
export const exportProgramsExcel = async (): Promise<Blob> => {
  const response = await api.get('/export/programs/excel', {
    responseType: 'blob'
  });
  return response.data;
};

// Export archived programs as PDF
export const exportArchivedPDF = async (): Promise<Blob> => {
  const response = await api.get('/export/archived/pdf', {
    responseType: 'blob'
  });
  return response.data;
};

// Export archived programs as Excel
export const exportArchivedExcel = async (): Promise<Blob> => {
  const response = await api.get('/export/archived/excel', {
    responseType: 'blob'
  });
  return response.data;
};

// Export single program as PDF
export const exportSingleProgramPDF = async (programId: string): Promise<Blob> => {
  const response = await api.get(`/export/programs/${programId}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

// Bulk export with filters
export const bulkExport = async (format: 'pdf' | 'excel', filters: any = {}): Promise<Blob> => {
  const response = await api.post('/export/bulk', {
    format,
    filters
  }, {
    responseType: 'blob'
  });
  return response.data;
};

// Custom export with template
export const customExport = async (
  format: 'pdf' | 'excel', 
  template: any, 
  dataType: 'programs' | 'archived' = 'programs'
): Promise<Blob> => {
  const response = await api.post('/export/custom', {
    format,
    template,
    dataType
  }, {
    responseType: 'blob'
  });
  return response.data;
};

// Helper function to download blob
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export templates (these are example structures, actual implementation depends on your template system)
export const exportTemplates = {
  basic: {
    title: 'Basic Program Report',
    name: 'Basic Report',
    columns: [
      { header: 'Program Name', key: 'name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Manager', key: 'manager', width: 25 },
      { header: 'Trainees', key: 'trainees', width: 10 },
    ]
  },
  detailed: {
    title: 'Detailed Program Report',
    name: 'Detailed Report',
    columns: [
      { header: 'Program Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Manager', key: 'manager', width: 25 },
      { header: 'Trainees', key: 'trainees', width: 10 },
      { header: 'Facilitators', key: 'facilitators', width: 12 },
    ]
  },
  summary: {
    title: 'Program Summary Report',
    name: 'Summary Report',
    columns: [
      { header: 'Program Name', key: 'name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration', key: 'duration', width: 20 },
      { header: 'Participants', key: 'participants', width: 15 },
    ]
  }
}; 

export const exportMasterLog = async (
  format: 'pdf' | 'excel', 
  filters: any
): Promise<Blob> => {
  const response = await api.post('/export/logs', {
    format,
    filters
  }, {
    responseType: 'blob'
  });
  return response.data;
};

// --- NEW EXPORT FUNCTIONS FOR PROGRAM ATTENDANCE REPORT ---
/**
 * Exports a program's attendance report as PDF.
 * @param programId The ID of the program.
 * @param startDate The start date for the report (YYYY-MM-DD).
 * @param endDate The end date for the report (YYYY-MM-DD).
 * @returns A promise that resolves to a Blob containing the PDF.
 */
export const exportProgramAttendancePDF = async (programId: string, startDate: string, endDate: string): Promise<Blob> => {
  const response = await api.get(`/export/attendance/program/${programId}`, {
    params: { startDate, endDate, format: 'pdf' },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Exports a program's attendance report as Excel.
 * @param programId The ID of the program.
 * @param startDate The start date for the report (YYYY-MM-DD).
 * @param endDate The end date for the report (YYYY-MM-DD).
 * @returns A promise that resolves to a Blob containing the Excel file.
 */
export const exportProgramAttendanceExcel = async (programId: string, startDate: string, endDate: string): Promise<Blob> => {
  const response = await api.get(`/export/attendance/program/${programId}`, {
    params: { startDate, endDate, format: 'excel' },
    responseType: 'blob'
  });
  return response.data;
};