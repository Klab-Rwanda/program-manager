import PDFDocument from 'pdfkit';

export const generateProgramReportPDF = (programData, attendanceData, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(`Program Report: ${programData.name}`, { align: 'center' });
    doc.moveDown();

    // Program Details
    doc.fontSize(14).text('Program Details', { underline: true });
    doc.fontSize(12).text(`Manager: ${programData.programManager.name}`);
    doc.text(`Status: ${programData.status}`);
    doc.text(`Duration: ${new Date(programData.startDate).toLocaleDateString()} to ${new Date(programData.endDate).toLocaleDateString()}`);
    doc.moveDown();

    // Attendance
    doc.fontSize(14).text('Attendance Records', { underline: true });
    if (attendanceData.length === 0) {
        doc.fontSize(12).text('No attendance records found for the selected period.');
    } else {
        attendanceData.forEach(record => {
            const checkIn = new Date(record.checkInTime).toLocaleTimeString();
            const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A';
            doc.fontSize(10).text(
                `Trainee: ${record.user.name} | Date: ${record.date} | Check-in: ${checkIn} | Check-out: ${checkOut}`
            );
        });
    }

    doc.end();
};

export const generateArchiveReportPDF = (archivedPrograms, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(24).text('Archived Programs Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.fontSize(12).text(`Total Archived Programs: ${archivedPrograms.length}`);
    doc.moveDown();

    // Programs List
    doc.fontSize(16).text('Archived Programs', { underline: true });
    doc.moveDown();

    archivedPrograms.forEach((program, index) => {
        doc.fontSize(14).text(`${index + 1}. ${program.name}`, { underline: true });
        doc.fontSize(10).text(`Description: ${program.description}`);
        doc.text(`Status: ${program.status}`);
        doc.text(`Duration: ${new Date(program.startDate).toLocaleDateString()} - ${new Date(program.endDate).toLocaleDateString()}`);
        doc.text(`Participants: ${program.trainees?.length || 0}`);
        doc.text(`Facilitators: ${program.facilitators?.length || 0}`);
        if (program.programManager) {
            doc.text(`Manager: ${program.programManager.name}`);
        }
        doc.moveDown();
    });

    doc.end();
};

export const generateBulkProgramsPDF = (programs, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(24).text('Programs Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.fontSize(12).text(`Total Programs: ${programs.length}`);
    
    const statusCounts = programs.reduce((acc, program) => {
        acc[program.status] = (acc[program.status] || 0) + 1;
        return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`);
    });
    doc.moveDown();

    // Programs List
    doc.fontSize(16).text('Programs', { underline: true });
    doc.moveDown();

    programs.forEach((program, index) => {
        doc.fontSize(14).text(`${index + 1}. ${program.name}`, { underline: true });
        doc.fontSize(10).text(`Description: ${program.description}`);
        doc.text(`Status: ${program.status}`);
        doc.text(`Duration: ${new Date(program.startDate).toLocaleDateString()} - ${new Date(program.endDate).toLocaleDateString()}`);
        doc.text(`Participants: ${program.trainees?.length || 0}`);
        doc.text(`Facilitators: ${program.facilitators?.length || 0}`);
        if (program.programManager) {
            doc.text(`Manager: ${program.programManager.name}`);
        }
        doc.moveDown();
    });

    doc.end();
};

export const generateCustomReportPDF = (data, template, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(24).text(template.title || 'Custom Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Custom sections based on template
    if (template.sections) {
        template.sections.forEach(section => {
            doc.fontSize(16).text(section.title, { underline: true });
            doc.moveDown();
            
            if (section.type === 'summary') {
                doc.fontSize(12).text(`Total Records: ${data.length}`);
            } else if (section.type === 'list') {
                data.forEach((item, index) => {
                    doc.fontSize(12).text(`${index + 1}. ${item[section.field] || item.name}`);
                });
            } else if (section.type === 'details') {
                data.forEach((item, index) => {
                    doc.fontSize(14).text(`${index + 1}. ${item.name}`, { underline: true });
                    section.fields.forEach(field => {
                        doc.fontSize(10).text(`${field.label}: ${item[field.key] || 'N/A'}`);
                    });
                    doc.moveDown();
                });
            }
            doc.moveDown();
        });
    }

    doc.end();
};