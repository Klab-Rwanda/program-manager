// lib/services/certificates.services.ts
import api from '../api';
import { Program, User as BackendUser } from '@/types'; // Assuming Program and User types are correctly defined in '@/types/index.ts'

// --- Frontend-specific interfaces for display ---
// Frontend specific Certificate interface for display (combines backend data with display logic)
export interface DisplayCertificate {
    _id: string; // Backend _id
    trainee: { _id: string; name: string; email: string };
    program: { _id: string; name: string };
    issueDate: string; // Date string from backend
    certificateId: string; // Backend ID
    status: 'issued' | 'ready' | 'pending'; // Derived on frontend: 'issued' is from backend
    grade: string; // Mocked
    finalScore: number; // Mocked
    attendanceRate: number; // Mocked
    templateId: number; // Mocked
    traineeName: string; // From trainee.name
    traineeEmail: string; // From trainee.email
    programName: string; // From program.name
}

export interface Template {
    id: number;
    name: string;
    description: string;
    isDefault: boolean;
    style: string;
    colorScheme: string;
}

// Interface for trainees eligible for certificates (includes mock eligibility data)
export interface TraineeForCert {
    _id: string;
    name: string;
    email: string;
    program: Program; // The full program object the trainee is associated with
    finalScore: number; // Mocked
    attendanceRate: number; // Mocked
    completionDate: string; // Mocked
    isEligible: boolean; // Derived on frontend
}

// --- Backend API calls ---

/**
 * Fetches all programs.
 * @returns A promise that resolves to an array of Program objects.
 */
export const fetchPrograms = async (): Promise<Program[]> => {
    const response = await api.get('/programs');
    return response.data.data;
};

/**
 * Fetches all users with the 'Trainee' role.
 * @returns A promise that resolves to an array of BackendUser objects.
 */
export const fetchAllTrainees = async (): Promise<BackendUser[]> => {
    const response = await api.get('/users/manage?role=Trainee');
    return response.data.data;
};

/**
 * Fetches certificates based on the user's role.
 * @param userRole - The role of the current user ('trainee', 'program_manager', 'super_admin').
 * @returns A promise that resolves to an array of DisplayCertificate objects.
 */
export const fetchCertificates = async (userRole: string | null): Promise<DisplayCertificate[]> => {
    let certificates: any[] = [];
    try {
        if (userRole === 'trainee') {
            const response = await api.get('/certificates/my-certificates');
            certificates = response.data.data;
        } else if (userRole === 'program_manager' || userRole === 'super_admin') {
            // Backend currently doesn't have a GET /certificates/all endpoint for PM/SA.
            // For now, we'll return mock data for these roles.
            // In a real app, you'd implement: GET /certificates (for all) or GET /certificates/program/:programId
            console.warn("Backend /certificates/all endpoint for PM/SA is not implemented. Returning mock certificates.");
            certificates = [
                {
                    _id: 'mock-cert-pm-1', trainee: { _id: 'mock-trainee-pm-1', name: 'PM Trainee One', email: 'pm.trainee1@example.com' },
                    program: { _id: 'mock-program-a', name: 'Web Dev Mastery' }, issueDate: '2024-03-01T00:00:00.000Z', certificateId: 'PM-WEB-2024-001',
                },
                {
                    _id: 'mock-cert-pm-2', trainee: { _id: 'mock-trainee-pm-2', name: 'PM Trainee Two', email: 'pm.trainee2@example.com' },
                    program: { _id: 'mock-program-b', name: 'Data Science Bootcamp' }, issueDate: '2024-03-10T00:00:00.000Z', certificateId: 'PM-DS-2024-002',
                },
            ];
        }
    } catch (error) {
        console.error("Error fetching certificates:", error);
        // Fallback to empty array on error
        certificates = [];
    }


    // Transform raw backend certs (or mock data) to DisplayCertificate, adding mocked fields
    const transformedCerts: DisplayCertificate[] = certificates.map((cert: any) => ({
        _id: cert._id,
        trainee: cert.trainee,
        program: cert.program,
        issueDate: cert.issueDate,
        certificateId: cert.certificateId,
        status: 'issued', // Assuming fetched certs are 'issued'
        grade: Math.random() > 0.5 ? 'A' : 'B+', // Mocked
        finalScore: Math.floor(Math.random() * 20) + 80, // Mocked 80-100
        attendanceRate: Math.floor(Math.random() * 10) + 90, // Mocked 90-100
        templateId: 1, // Mocked
        traineeName: cert.trainee?.name || 'Unknown Trainee',
        traineeEmail: cert.trainee?.email || 'unknown@example.com',
        programName: cert.program?.name || 'Unknown Program',
    }));
    return transformedCerts;
};

/**
 * Fetches mock certificate templates.
 * @returns A promise that resolves to an array of Template objects.
 */
export const fetchTemplates = async (): Promise<Template[]> => {
    // This would be replaced by an API call if you had template management backend
    return [
        { id: 1, name: "Professional Certificate", description: "Clean, professional design with company branding", isDefault: true, style: "professional", colorScheme: "blue", },
        { id: 2, name: "Modern Achievement", description: "Contemporary design with geometric elements", isDefault: false, style: "modern", colorScheme: "gray", },
    ];
};

/**
 * Calculates and returns a list of trainees eligible for certificates based on mock criteria.
 * @param programs - All available programs.
 * @param allBackendTrainees - All trainees from the backend.
 * @returns A promise that resolves to an array of TraineeForCert objects.
 */
export const fetchEligibleTrainees = async (programs: Program[], allBackendTrainees: BackendUser[]): Promise<TraineeForCert[]> => {
    // Create a program lookup map for efficient access
    const programLookup = new Map(programs.map(p => [p._id, p]));

    const eligible: TraineeForCert[] = allBackendTrainees.map(t => {
        // Find programs this trainee is actually associated with (from program.trainees array)
        // Note: Your backend's Program model's `trainees` field is an array of populated User objects.
        // So `p.trainees?.some(pt => pt._id === t._id)` is correct.
        const associatedProgram = programs.find(p => p.trainees?.some(pt => pt._id === t._id));

        // If no associated program is found, assign a default/unknown program or skip.
        // For eligibility, a trainee must usually be part of a program.
        if (!associatedProgram) {
            // You might choose to skip them if they aren't tied to any program
            return null; // Filter out later
        }

        // Mocked eligibility criteria: random score >= 80 and attendance >= 85
        const mockFinalScore = Math.floor(Math.random() * 20) + 75; // 75-95
        const mockAttendanceRate = Math.floor(Math.random() * 15) + 80; // 80-95

        return {
            _id: t._id,
            name: t.name,
            email: t.email,
            program: associatedProgram, // Assign the actual associated program object
            finalScore: mockFinalScore,
            attendanceRate: mockAttendanceRate,
            completionDate: new Date(associatedProgram.endDate || t.createdAt).toISOString().split('T')[0], // Use program end date or trainee creation date
            isEligible: mockFinalScore >= 80 && mockAttendanceRate >= 85, // Frontend eligibility logic
        };
    }).filter((t): t is TraineeForCert => t !== null && t.isEligible); // Filter out nulls and non-eligible trainees

    return eligible;
};

/**
 * Issues certificates to a list of trainees.
 * @param traineesToIssue - An array of TraineeForCert objects (containing trainee ID and program ID).
 * @param templateId - The ID of the selected certificate template (frontend mock).
 * @returns A promise that resolves to an array of results from the API calls.
 */
export const issueCertificatesToTrainees = async (
    traineesToIssue: TraineeForCert[],
    templateId: string // This templateId is currently unused by the backend /certificates/issue endpoint
): Promise<PromiseSettledResult<any>[]> => {
    const issuePromises = traineesToIssue.map(trainee => {
        // The backend's /certificates/issue endpoint requires `programId` and `traineeId`.
        // Ensure `trainee.program._id` is available from the `TraineeForCert` object.
        if (!trainee.program?._id) {
            console.error(`Skipping certificate issuance for trainee ${trainee.name}: Program ID is missing.`);
            return Promise.reject(new Error("Missing program ID for trainee"));
        }

        return api.post('/certificates/issue', {
            programId: trainee.program._id, // Use the actual program ID
            traineeId: trainee._id
        });
    });

    return Promise.allSettled(issuePromises);
};