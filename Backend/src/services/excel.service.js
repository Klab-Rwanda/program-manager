import ExcelJS from 'exceljs';

export const generateProgramsExcel = async (programs) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programs');

    // Define columns
    worksheet.columns = [
        { header: 'Program Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Manager', key: 'manager', width: 25 },
        { header: 'Trainees', key: 'trainees', width: 10 },
        { header: 'Facilitators', key: 'facilitators', width: 12 },
        { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // Add data
    programs.forEach(program => {
        worksheet.addRow({
            name: program.name,
            description: program.description,
            status: program.status,
            startDate: new Date(program.startDate).toLocaleDateString(),
            endDate: new Date(program.endDate).toLocaleDateString(),
            manager: program.programManager?.name || 'Not Assigned',
            trainees: program.trainees?.length || 0,
            facilitators: program.facilitators?.length || 0,
            createdAt: new Date(program.createdAt).toLocaleDateString(),
        });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
};

export const generateArchiveExcel = async (archivedPrograms) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Archived Programs');

    // Define columns
    worksheet.columns = [
        { header: 'Program Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Manager', key: 'manager', width: 25 },
        { header: 'Trainees', key: 'trainees', width: 10 },
        { header: 'Facilitators', key: 'facilitators', width: 12 },
        { header: 'Archived At', key: 'updatedAt', width: 20 },
    ];

    // Add data
    archivedPrograms.forEach(program => {
        worksheet.addRow({
            name: program.name,
            description: program.description,
            status: program.status,
            startDate: new Date(program.startDate).toLocaleDateString(),
            endDate: new Date(program.endDate).toLocaleDateString(),
            manager: program.programManager?.name || 'Not Assigned',
            trainees: program.trainees?.length || 0,
            facilitators: program.facilitators?.length || 0,
            updatedAt: new Date(program.updatedAt).toLocaleDateString(),
        });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
};

export const generateCustomExcel = async (data, template) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(template.name || 'Custom Report');

    // Define columns based on template
    if (template.columns) {
        worksheet.columns = template.columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 15
        }));
    }

    // Add data
    data.forEach(item => {
        const row = {};
        if (template.columns) {
            template.columns.forEach(col => {
                row[col.key] = item[col.key] || '';
            });
        }
        worksheet.addRow(row);
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
};

export const generateBulkExportExcel = async (data, options = {}) => {
    const workbook = new ExcelJS.Workbook();
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 20 },
        { header: 'Value', key: 'value', width: 15 },
    ];

    const summaryData = [
        { metric: 'Total Programs', value: data.length },
        { metric: 'Active Programs', value: data.filter(p => p.status === 'Active').length },
        { metric: 'Draft Programs', value: data.filter(p => p.status === 'Draft').length },
        { metric: 'Completed Programs', value: data.filter(p => p.status === 'Completed').length },
        { metric: 'Total Trainees', value: data.reduce((sum, p) => sum + (p.trainees?.length || 0), 0) },
        { metric: 'Total Facilitators', value: data.reduce((sum, p) => sum + (p.facilitators?.length || 0), 0) },
    ];

    summaryData.forEach(row => summarySheet.addRow(row));
    summarySheet.getRow(1).font = { bold: true };

    // Add detailed sheet
    const detailSheet = workbook.addWorksheet('Program Details');
    detailSheet.columns = [
        { header: 'Program Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Manager', key: 'manager', width: 25 },
        { header: 'Trainees', key: 'trainees', width: 10 },
        { header: 'Facilitators', key: 'facilitators', width: 12 },
    ];

    data.forEach(program => {
        detailSheet.addRow({
            name: program.name,
            description: program.description,
            status: program.status,
            startDate: new Date(program.startDate).toLocaleDateString(),
            endDate: new Date(program.endDate).toLocaleDateString(),
            manager: program.programManager?.name || 'Not Assigned',
            trainees: program.trainees?.length || 0,
            facilitators: program.facilitators?.length || 0,
        });
    });

    detailSheet.getRow(1).font = { bold: true };

    return workbook;
}; 

export const generateLogReportExcel = async (logs) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activity Log');

    worksheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 25 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'User Role', key: 'userRole', width: 20 },
        { header: 'Action', key: 'action', width: 30 },
        { header: 'Details', key: 'details', width: 50 },
    ];

    logs.forEach(log => {
        worksheet.addRow({
            timestamp: new Date(log.createdAt),
            userName: log.user?.name || 'System/Unknown',
            userRole: log.user?.role || 'N/A',
            action: log.action,
            details: log.details,
        });
    });
    
    worksheet.getRow(1).font = { bold: true };
    return workbook;
};