import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Program } from '../models/program.model.js';
import { 
    generateProgramReportPDF, 
    generateArchiveReportPDF, 
    generateBulkProgramsPDF,
    generateCustomReportPDF, 
    generateLogReportPDF
} from '../../services/pdf.service.js';
import { 
    generateProgramsExcel, 
    generateArchiveExcel, 
    generateCustomExcel,
    generateBulkExportExcel, 
    generateLogReportExcel
} from '../../services/excel.service.js';
import { Log } from '../models/log.model.js';

// Export all programs as PDF
const exportProgramsPDF = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    let query = {};
    
    // Filter by user role
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    const programs = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=programs-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    generateBulkProgramsPDF(programs, res);
});

// Export all programs as Excel
const exportProgramsExcel = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    let query = {};
    
    // Filter by user role
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    const programs = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ createdAt: -1 });

    const workbook = await generateProgramsExcel(programs);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=programs-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
});

// Export archived programs as PDF
const exportArchivedPDF = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    let query = { isActive: false };
    
    // Filter by user role
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    const archivedPrograms = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ updatedAt: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=archived-programs-${new Date().toISOString().split('T')[0]}.pdf`);
    
    generateArchiveReportPDF(archivedPrograms, res);
});

// Export archived programs as Excel
const exportArchivedExcel = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    let query = { isActive: false };
    
    // Filter by user role
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    const archivedPrograms = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ updatedAt: -1 });

    const workbook = await generateArchiveExcel(archivedPrograms);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=archived-programs-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
});

// Export single program as PDF
const exportSingleProgramPDF = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, _id } = req.user;
    
    // Check permissions
    if (role === 'Program Manager') {
        const program = await Program.findOne({ _id: id, programManager: _id });
        if (!program) {
            throw new ApiError(404, "Program not found or you don't have permission to access it");
        }
    }
    
    const program = await Program.findById(id)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email');
    
    if (!program) {
        throw new ApiError(404, "Program not found");
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=program-${program.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // For now, we'll use the bulk PDF generator for single programs
    generateBulkProgramsPDF([program], res);
});

// Bulk export with filters
const bulkExport = asyncHandler(async (req, res) => {
    const { format = 'excel', filters = {} } = req.body;
    const { role, _id } = req.user;
    
    let query = {};
    
    // Apply role-based filtering
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    // Apply custom filters
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.startDate && filters.endDate) {
        query.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }
    
    if (filters.includeArchived) {
        delete query.isActive; // Remove the default active filter
    } else {
        query.isActive = { $ne: false };
    }
    
    const programs = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ createdAt: -1 });

    if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bulk-export-${new Date().toISOString().split('T')[0]}.pdf`);
        generateBulkProgramsPDF(programs, res);
    } else {
        const workbook = await generateBulkExportExcel(programs, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=bulk-export-${new Date().toISOString().split('T')[0]}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
});

// Custom export with template
const customExport = asyncHandler(async (req, res) => {
    const { format = 'excel', template, dataType = 'programs' } = req.body;
    const { role, _id } = req.user;
    
    let query = {};
    
    // Apply role-based filtering
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    
    let data;
    if (dataType === 'archived') {
        query.isActive = false;
        data = await Program.find(query)
            .populate('programManager', 'name email')
            .populate('facilitators', 'name email')
            .populate('trainees', 'name email')
            .sort({ updatedAt: -1 });
    } else {
        data = await Program.find(query)
            .populate('programManager', 'name email')
            .populate('facilitators', 'name email')
            .populate('trainees', 'name email')
            .sort({ createdAt: -1 });
    }

    if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=custom-export-${new Date().toISOString().split('T')[0]}.pdf`);
        generateCustomReportPDF(data, template, res);
    } else {
        const workbook = await generateCustomExcel(data, template);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=custom-export-${new Date().toISOString().split('T')[0]}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
});

export const exportLogs = asyncHandler(async (req, res) => {
    const { format = 'pdf', filters = {} } = req.body;
    
    // Build query from filters passed by the frontend
    let query = {};
    if (filters.action) query.action = filters.action;
    if (filters.userId) query.user = filters.userId;
    if (filters.startDate && filters.endDate) {
        query.createdAt = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }

    const logs = await Log.find(query)
        .sort({ createdAt: -1 })
        .populate('user', 'name role');
        
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=master-log-${dateStr}.pdf`);
        generateLogReportPDF(logs, filters, res);
    } else { // excel
        const workbook = await generateLogReportExcel(logs);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=master-log-${dateStr}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
});


export {
    exportProgramsPDF,
    exportProgramsExcel,
    exportArchivedPDF,
    exportArchivedExcel,
    exportSingleProgramPDF,
    bulkExport,
    customExport
}; 