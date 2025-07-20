import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Certificate } from '../models/certificate.model.js';
import { ProgramUser } from '../models/programUser.modal.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';

/**
 * POST /certificates/issue
 */
const issueCertificate = asyncHandler(async (req, res) => {
  const { programId, traineeId } = req.body;

  const existingCert = await Certificate.findOne({ program: programId, trainee: traineeId });
  if (existingCert) {
    throw new ApiError(409, "A certificate has already been issued to this trainee for this program.");
  }

  const certificate = await Certificate.create({
    program: programId,
    trainee: traineeId,
    issueDate: new Date(),
  });

  return res.status(201).json(new ApiResponse(201, certificate, "Certificate issued successfully."));
});

/**
 * GET /certificates (Admin only)
 */
const getAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find()
    .populate('trainee', 'name email')
    .populate('rogram', 'name');

  return res.status(200).json(new ApiResponse(200, certificates, "All certificates fetched successfully."));
});

/**
 * GET /certificates/me
 */
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ trainee: req.user._id })
    .populate('program', 'name');

  return res.status(200).json(new ApiResponse(200, certificates, "Your certificates fetched successfully."));
});

/**
 * GET /certificates/eligible-students
 */
const getEligibleStudents = asyncHandler(async (req, res) => {
  const trainees = await ProgramUser.find({ role: 'trainee' })
    .populate('user', 'name email')
    .populate('program', 'name')
    .lean();

  // Define eligibility logic (score ≥ 80, attendance ≥ 85, and isEligible: true)
  const eligible = trainees.filter(t => {
    return (
      t.finalScore >= 80 &&
      t.attendanceRate >= 85 &&
      t.isEligible
    );
  });

  const formatted = eligible.map(t => ({
    id: t._id,
    name: t.user.name,
    email: t.user.email,
    program: t.program.name,
    finalScore: t.finalScore,
    attendanceRate: t.attendanceRate,
    completionDate: t.completionDate,
    isEligible: t.isEligible,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Eligible students fetched."));
});

/**
 * GET /certificates/templates
 */
const getCertificateTemplates = asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 1,
      name: "Professional Certificate",
      description: "Clean, professional design with company branding",
      isDefault: true,
      style: "professional",
      colorScheme: "blue"
    },
    {
      id: 2,
      name: "Modern Achievement",
      description: "Contemporary design with geometric elements",
      isDefault: false,
      style: "modern",
      colorScheme: "gray"
    }
  ];

  return res.status(200).json(new ApiResponse(200, templates, "Templates fetched successfully."));
});

export {
  issueCertificate,
  getAllCertificates,
  getMyCertificates,
  getEligibleStudents,
  getCertificateTemplates
};
