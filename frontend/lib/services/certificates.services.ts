// lib/services/certificates.services.ts
import api from '../api';
import { Program, User as BackendUser } from '@/types'; 

// --- Frontend-specific interfaces for display ---

// Backend Certificate structure from src/api/models/certificate.model.js
export interface BackendCertificate {
    _id: string;
    trainee: string | { _id: string; name: string; email: string }; // Can be populated or just ID
    program: string | { _id: string; name: string }; // Can be populated or just ID
    issueDate: string;
    certificateId: string;
}

// Frontend Display Certificate interface
export interface DisplayCertificate {
    _id: string;
    traineeName: string;
    traineeEmail: string;
    program: string; // Just program name for display
    programId: string; // The program's actual ID
    issueDate: string;
    certificateId: string;
    // Mocked/derived fields for display
    status: 'issued' | 'ready' | 'pending'; 
    grade: string; 
    finalScore: number; 
    attendanceRate: number; 
    templateId?: string; // ID of the template used (optional, from frontend logic)
}

// Backend CertificateTemplate structure from src/api/models/certificateTemplate.model.js
export interface Template {
    _id: string; // MongoDB _id
    name: string;
    description: string;
    style: string;
    colorScheme: string;
    htmlContent?: string; // Optional HTML content for complex templates
    isDefault: boolean;
    createdBy?: string | { _id: string; name: string; email: string }; // Populated user or just ID
    createdAt: string;
    updatedAt: string;
}

// Trainee eligible for certificates (from backend aggregate)
export interface TraineeForCert {
    _id: string;
    name: string;
    email: string;
    program: string; // Program name (from backend aggregation $project)
    programId: string; // Program ID (from backend aggregation $project)
    finalScore: number;
    attendanceRate: number;
    completionDate: string;
    isEligible: boolean; // True if passed eligibility criteria
}

// --- Backend API calls ---

/**
 * Fetches certificates based on the user's role.
 * The backend handles role-based filtering automatically.
 * @returns A promise that resolves to an array of DisplayCertificate objects.
 */
export const fetchCertificates = async (): Promise<DisplayCertificate[]> => {
    const response = await api.get('/certificates');
    const backendCerts: BackendCertificate[] = response.data.data;

    // Transform backend certs to DisplayCertificate format
    const transformedCerts: DisplayCertificate[] = backendCerts.map((cert: BackendCertificate) => {
        // Ensure trainee and program are objects for safe access
        const trainee = typeof cert.trainee === 'object' && cert.trainee !== null ? cert.trainee : { _id: '', name: 'Unknown', email: '' };
        const program = typeof cert.program === 'object' && cert.program !== null ? cert.program : { _id: '', name: 'Unknown' };

        return {
            _id: cert._id,
            traineeName: trainee.name,
            traineeEmail: trainee.email,
            program: program.name,
            programId: program._id,
            issueDate: cert.issueDate,
            certificateId: cert.certificateId,
            status: 'issued', // Assuming fetched certs are always 'issued' for now
            grade: Math.random() > 0.5 ? 'A' : 'B+', // Mocked, would come from a real grading system
            finalScore: Math.floor(Math.random() * 20) + 80, // Mocked 80-100
            attendanceRate: Math.floor(Math.random() * 10) + 90, // Mocked 90-100
        };
    });
    return transformedCerts;
};

/**
 * Fetches certificate templates.
 * @returns A promise that resolves to an array of Template objects.
 */
export const fetchTemplates = async (): Promise<Template[]> => {
    const response = await api.get('/certificates/templates');
    return response.data.data;
};

/**
 * Fetches trainees eligible for certificates (calculated by backend).
 * @returns A promise that resolves to an array of TraineeForCert objects.
 */
export const fetchEligibleTrainees = async (): Promise<TraineeForCert[]> => {
    const response = await api.get('/certificates/eligible-students');
    return response.data.data;
};

/**
 * Issues certificates to a list of trainees.
 * @param traineesToIssue - An array of TraineeForCert objects (containing trainee ID and program ID).
 * @param templateId - The ID of the selected certificate template (backend may or may not use this yet).
 * @returns A promise that resolves to an array of results from the API calls.
 */
export const issueCertificatesToTrainees = async (
    traineesToIssue: TraineeForCert[],
    templateId: string // The ID of the selected template to use (optional for backend, but useful for frontend)
): Promise<PromiseSettledResult<any>[]> => {
    const issuePromises = traineesToIssue.map(trainee => {
        return api.post('/certificates/issue', {
            programId: trainee.programId, 
            traineeId: trainee._id,
            // You might pass templateId here if your backend's issueCertificate supports it
            // templateId: templateId 
        });
    });

    return Promise.allSettled(issuePromises);
};

/**
 * Creates a new certificate template.
 * @param data The template data.
 * @returns A promise that resolves to the created Template object.
 */
export const createCertificateTemplate = async (data: Partial<Template>): Promise<Template> => {
    const response = await api.post('/certificates/templates', data);
    return response.data.data;
};

/**
 * Updates an existing certificate template.
 * @param id The ID of the template to update.
 * @param data The update data.
 * @returns A promise that resolves to the updated Template object.
 */
export const updateCertificateTemplate = async (id: string, data: Partial<Template>): Promise<Template> => {
    const response = await api.patch(`/certificates/templates/${id}`, data);
    return response.data.data;
};

/**
 * Deletes a certificate template.
 * @param id The ID of the template to delete.
 * @returns A promise that resolves when the template is deleted.
 */
export const deleteCertificateTemplate = async (id: string): Promise<void> => {
    await api.delete(`/certificates/templates/${id}`);
};