import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js'; // Added for program manager check
import { ClassSession } from '../models/classSession.model.js'; // Added for attendance data
import { Attendance } from '../models/attendance.model.js'; // Added for attendance data

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
import {
    generateProgramAttendanceExcel, // New import
    generateProgramAttendancePDF    // New import
} from '../../services/excel_pdf_attendance_service.js'; // New service file for attendance reports

import { Log } from '../models/log.model.js';

// --- Helper function to get structured attendance data for export ---
// This function duplicates the logic from `attendance.controller.js`'s getProgramAttendanceReport
// to avoid circular dependency issues when importing controllers into services/controllers mutually.
const getStructuredProgramAttendanceData = async (programId, startDate, endDate, userRole, userId) => {
    if (!programId || !startDate || !endDate) {
        throw new ApiError(400, "Program ID, start date, and end date are required.");
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0); // Ensure start of day UTC
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999); // Ensure end of day UTC

    const program = await Program.findById(programId).populate('trainees', 'name email');
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    // Program Manager access check
    if (userRole === 'Program Manager' && program.programManager?.toString() !== userId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }


    const traineeIds = program.trainees.map(t => t._id);
    if (traineeIds.length === 0) {
        return {
            programName: program.name,
            reportDates: [],
            traineeReports: [],
            summaryStats: {
                totalDaysInPeriod: 0,
                totalPresentCount: 0,
                totalAbsentCount: 0,
                totalLateCount: 0,
                totalExcusedCount: 0,
                totalTrainees: 0
            }
        };
    }

    const classSessions = await ClassSession.find({
        programId: programId,
        startTime: { $gte: start, $lte: end },
        status: { $in: ['active', 'completed'] }
    }).select('startTime');

    const reportDatesSet = new Set();
    classSessions.forEach(session => {
        reportDatesSet.add(new Date(session.startTime).toISOString().split('T')[0]);
    });
    const reportDates = Array.from(reportDatesSet).sort();

    const attendanceRecords = await Attendance.find({
        userId: { $in: traineeIds },
        programId: programId,
        timestamp: { $gte: start, $lte: end }
    }).select('userId date status timestamp');

    const attendanceByTraineeIdAndDate = new Map();
    attendanceRecords.forEach(record => {
        const traineeStringId = record.userId.toString();
        const recordDate = record.date;

        if (!attendanceByTraineeIdAndDate.has(traineeStringId)) {
            attendanceByTraineeIdAndDate.set(traineeStringId, new Map());
        }

        const traineeDailyMap = attendanceByTraineeIdAndDate.get(traineeStringId);

        if (!traineeDailyMap.has(recordDate) || new Date(record.timestamp) > new Date(traineeDailyMap.get(recordDate).timestamp)) {
             traineeDailyMap.set(recordDate, { status: record.status, timestamp: record.timestamp });
        }
    });

    const traineeReports = program.trainees.map(trainee => {
        const dailyAttendance = [];
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;

        for (const date of reportDates) {
            const status = attendanceByTraineeIdAndDate.get(trainee._id.toString())?.get(date)?.status || 'Absent';
            dailyAttendance.push({ date, status });

            if (status === 'Present') presentCount++;
            else if (status === 'Absent') absentCount++;
            else if (status === 'Late') lateCount++;
            else if (status === 'Excused') excusedCount++;
        }

        return {
            trainee: {
                _id: trainee._id,
                name: trainee.name,
                email: trainee.email
            },
            dailyAttendance,
            summary: {
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                excused: excusedCount,
                totalDaysInPeriod: reportDates.length
            }
        };
    });
    
    const overallTotalPresent = traineeReports.reduce((sum, tr) => sum + tr.summary.present, 0);
    const overallTotalAbsent = traineeReports.reduce((sum, tr) => sum + tr.summary.absent, 0);
    const overallTotalLate = traineeReports.reduce((sum, tr) => sum + tr.summary.late, 0);
    const overallTotalExcused = traineeReports.reduce((sum, tr) => sum + tr.summary.excused, 0);

    const summaryStats = {
        totalDaysInPeriod: reportDates.length,
        totalPresentCount: overallTotalPresent,
        totalAbsentCount: overallTotalAbsent,
        totalLateCount: overallTotalLate,
        totalExcusedCount: overallTotalExcused,
        totalTrainees: program.trainees.length
    };

    return {
        programName: program.name,
        reportDates,
        traineeReports,
        summaryStats
    };
};

// --- New Export Endpoint for Program Attendance Report ---
export const exportProgramAttendance = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { startDate, endDate, format } = req.query;

    if (!programId || !startDate || !endDate || !format) {
        throw new ApiError(400, "Program ID, start date, end date, and format are required.");
    }

    const reportData = await getStructuredProgramAttendanceData(
        programId,
        startDate,
        endDate,
        req.user.role, // Pass user role for access check within helper
        req.user._id  // Pass user ID for access check within helper
    );

    const dateRangeStr = `${new Date(startDate).toISOString().split('T')[0]}_${new Date(endDate).toISOString().split('T')[0]}`;
    const fileName = `attendance_report_${reportData.programName.replace(/\s+/g, '-')}_${dateRangeStr}`;

    if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.pdf`);
        generateProgramAttendancePDF(reportData, res);
    } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);
        const workbook = await generateProgramAttendanceExcel(reportData);
        await workbook.xlsx.write(res);
        res.end();
    } else {
        throw new ApiError(400, "Invalid export format. Must be 'pdf' or 'excel'.");
    }
});


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
    customExport,
     
}; 