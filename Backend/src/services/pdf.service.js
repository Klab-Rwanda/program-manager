import PDFDocument from 'pdfkit';
import path from 'path'; 
import fs from 'fs';

function getContrastColor(hexcolor) {
    if (!hexcolor || hexcolor === 'transparent') return '#000000';
    const cleanHex = hexcolor.startsWith('#') ? hexcolor.substring(1) : hexcolor;
    if (cleanHex.length !== 6) {
        console.warn(`Invalid hex color for contrast calculation: ${hexcolor}`);
        return '#000000';
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return (hsp > 127.5) ? '#000000' : '#ffffff';
}

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

export const generateLogReportPDF = (logs, filters, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    doc.fontSize(20).text('Master Activity Log Report', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    if (filters.startDate && filters.endDate) {
        doc.fontSize(10).text(`Period: ${filters.startDate} to ${filters.endDate}`, { align: 'center' });
    }
    doc.moveDown(2);
    
    // Table Headers
    const tableTop = doc.y;
    const itemX = 50;
    const userX = 150;
    const actionX = 280;
    const detailsX = 400;

    doc.fontSize(10).font('Helvetica-Bold')
       .text('Timestamp', itemX)
       .text('User (Role)', userX)
       .text('Action', actionX)
       .text('Details', detailsX)
       .moveDown(0.5);
    
    // Table Body
    doc.font('Helvetica');
    logs.forEach(log => {
        const y = doc.y;
        doc.text(new Date(log.createdAt).toLocaleString(), itemX, y, { width: 100 })
           .text(`${log.user?.name || 'N/A'} (${log.user?.role || 'N/A'})`, userX, y, { width: 120 })
           .text(log.action.replace(/_/g, ' '), actionX, y, { width: 110 })
           .text(log.details, detailsX, y, { width: 150 });
        doc.moveDown(1.5);
    });

    doc.end();
};


// Updated in pdf.service.js
export const generateCertificatePDF = (certificateData, templateData, stream) => {
    try {
        const doc = new PDFDocument({
            size: 'LETTER',
            layout: 'landscape',
            margin: 0
        });

        // Error handling for the stream
        doc.on('error', (err) => {
            console.error('PDF generation error:', err);
            if (!stream.destroyed) {
                stream.emit('error', err);
            }
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
            doc.end();
        });

        doc.pipe(stream);

        // Use only standard PDF fonts
        const primaryColor = '#1f497d';
        const secondaryColor = '#d4af37';
        const backgroundColor = '#f9f9f9';
        const textColor = '#333333';

        const width = doc.page.width;
        const height = doc.page.height;

        // --- Background ---
        doc.rect(0, 0, width, height).fill(backgroundColor);
        
        // Border
        doc.lineWidth(8)
           .moveTo(40, 40)
           .lineTo(width-40, 40)
           .lineTo(width-40, height-40)
           .lineTo(40, height-40)
           .lineTo(40, 40)
           .stroke(secondaryColor);

        // --- Content ---
        // Logo (if available)
        const logoPath = path.resolve('./public/images/klab-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 60, 60, { width: 80 });
        }

        // Title
        doc.font('Helvetica-Bold')
           .fontSize(36)
           .fillColor(primaryColor)
           .text('CERTIFICATE OF ACHIEVEMENT', 0, 100, {
               align: 'center',
               width: width
           });

        // Recipient
        doc.font('Helvetica')
           .fontSize(18)
           .fillColor(textColor)
           .text('This is to certify that', { align: 'center' });

        doc.font('Helvetica-Bold')
           .fontSize(42)
           .fillColor(primaryColor)
           .text(certificateData.trainee.name.toUpperCase(), { 
               align: 'center',
               paragraphGap: 5
           });

        // Program
        const programDescription = certificateData.program.description || 
                                 'Has successfully completed all requirements of the program';
        
        doc.font('Helvetica')
           .fontSize(16)
           .text(`for the completion of ${certificateData.program.name}`, { align: 'center' });

        // Description box
        const descBoxHeight = 100;
        doc.roundedRect(width/2 - 250, doc.y + 20, 500, descBoxHeight, 10)
           .fill('#ffffff')
           .stroke(secondaryColor);
        
        doc.font('Helvetica')
           .fontSize(12)
           .fillColor('#555555')
           .text(programDescription, width/2 - 230, doc.y + 40, {
               width: 460,
               align: 'center'
           });

        // Completion date
        doc.font('Helvetica')
           .fontSize(14)
           .fillColor(textColor)
           .text(`Completed on: ${new Date(certificateData.issueDate).toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
           })}`, { align: 'center' });

        // --- Signatures ---
        const signatureY = height - 180;
        const signatureWidth = 200;

        // Program Manager
        doc.moveTo(width/4 - signatureWidth/2, signatureY)
           .lineTo(width/4 + signatureWidth/2, signatureY)
           .stroke(primaryColor);
        
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(primaryColor)
           .text(certificateData.program.programManager?.name || 'Program Manager', 
               width/4 - signatureWidth/2, signatureY - 30, {
                   width: signatureWidth,
                   align: 'center'
               });
        
        doc.font('Helvetica')
           .fontSize(10)
           .text('Program Manager', width/4 - signatureWidth/2, signatureY + 10, {
               width: signatureWidth,
               align: 'center'
           });

        // General Manager
        doc.moveTo(3*width/4 - signatureWidth/2, signatureY)
           .lineTo(3*width/4 + signatureWidth/2, signatureY)
           .stroke(primaryColor);
        
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(primaryColor)
           .text(templateData.superAdminName || 'General Manager', 
               3*width/4 - signatureWidth/2, signatureY - 30, {
                   width: signatureWidth,
                   align: 'center'
               });
        
        doc.font('Helvetica')
           .fontSize(10)
           .text('General Manager', 3*width/4 - signatureWidth/2, signatureY + 10, {
               width: signatureWidth,
               align: 'center'
           });

        // Footer
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#777777')
           .text(`Certificate ID: ${certificateData.certificateId} | Issued by KLab`, 
               0, height - 50, {
                   align: 'center',
                   width: width
               });

        doc.end();

    } catch (err) {
        console.error('Certificate generation failed:', err);
        if (!stream.destroyed) {
            stream.emit('error', new Error('Failed to generate certificate'));
        }
        throw err;
    }
};