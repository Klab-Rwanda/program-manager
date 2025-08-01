// src/services/excel_pdf_attendance_service.js
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Returns a Unicode symbol for attendance status.
 * @param {string} status - The attendance status (e.g., 'Present', 'Late', 'Absent', 'Excused').
 * @returns {string} Corresponding Unicode symbol.
 */
const getStatusSymbol = (status) => {
    switch (status) {
        case 'Present': return '✔️'; // Checkmark
        case 'Late': return '⚠️';   // Warning sign for late
        case 'Absent': return '❌';   // Cross mark
        case 'Excused': return '✅';  // Green checkmark for excused
        default: return '❓'; // Question mark for unknown
    }
};

/**
 * Generates an Excel attendance report.
 * @param {object} reportData - Structured data for the attendance report.
 * @returns {Promise<ExcelJS.Workbook>} Excel workbook object.
 */
export const generateProgramAttendanceExcel = async (reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    const { programName, reportDates, traineeReports, summaryStats } = reportData;

    // --- Report Header ---
    worksheet.mergeCells('A1:Z1'); // Merge enough cells to cover the title
    worksheet.getCell('A1').value = `Attendance Report for Program: ${programName}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Date Range
    worksheet.mergeCells('A2:Z2');
    const startDateFormatted = reportDates.length > 0 ? new Date(reportDates[0]).toLocaleDateString() : 'N/A';
    const endDateFormatted = reportDates.length > 0 ? new Date(reportDates[reportDates.length - 1]).toLocaleDateString() : 'N/A';
    worksheet.getCell('A2').value = `Period: ${startDateFormatted} to ${endDateFormatted}`;
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20; // Give it some height
    worksheet.addRow([]); // Empty row for spacing

    // --- Summary Statistics ---
    worksheet.addRow(['Summary Statistics:']).font = { bold: true };
    worksheet.addRow(['Total Trainees:', summaryStats.totalTrainees]);
    worksheet.addRow(['Total Class Days in Period:', summaryStats.totalDaysInPeriod]);
    worksheet.addRow(['Overall Present Marks:', summaryStats.totalPresentCount]);
    worksheet.addRow(['Overall Absent Marks:', summaryStats.totalAbsentCount]);
    worksheet.addRow(['Overall Late Marks:', summaryStats.totalLateCount]);
    worksheet.addRow(['Overall Excused Marks:', summaryStats.totalExcusedCount]);
    worksheet.addRow([]); // Empty row for spacing

    // --- Table Headers ---
    const headers = [{ header: 'Trainee Name', key: 'name', width: 30 }];
    reportDates.forEach(date => {
        headers.push({ header: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }), key: date, width: 12 });
    });
    headers.push({ header: 'P', key: 'present', width: 5 }); // Present count
    headers.push({ header: 'L', key: 'late', width: 5 });     // Late count
    headers.push({ header: 'A', key: 'absent', width: 5 });   // Absent count
    headers.push({ header: 'E', key: 'excused', width: 5 });  // Excused count
    
    worksheet.columns = headers;

    // Apply bold and fill to header row
    const headerRow = worksheet.getRow(worksheet.rowCount);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Light gray background
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25; // Header row height

    // --- Table Body ---
    traineeReports.forEach(tr => {
        const rowData = { name: tr.trainee.name };
        tr.dailyAttendance.forEach(da => {
            rowData[da.date] = getStatusSymbol(da.status);
        });
        rowData['present'] = tr.summary.present;
        rowData['late'] = tr.summary.late;
        rowData['absent'] = tr.summary.absent;
        rowData['excused'] = tr.summary.excused;
        worksheet.addRow(rowData);
    });

    // Style the symbol cells
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > headerRow.number) { // Only for data rows (below header)
            row.height = 20; // Set row height for data rows
            row.eachCell((cell, colNumber) => {
                if (colNumber > 1 && colNumber <= reportDates.length + 1) { // Only for daily attendance columns
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    // Optional: add color based on symbol
                    if (cell.value === '❌') cell.font = { color: { argb: 'FFFF0000' } }; // Red
                    else if (cell.value === '✔️') cell.font = { color: { argb: 'FF00B050' } }; // Green
                    else if (cell.value === '⚠️') cell.font = { color: { argb: 'FFFFC000' } }; // Orange
                    else if (cell.value === '✅') cell.font = { color: { argb: 'FF92D050' } }; // Light Green for Excused
                } else if (colNumber > reportDates.length + 1) { // Summary columns
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        }
    });

    return workbook;
};

/**
 * Generates a PDF attendance report.
 * @param {object} reportData - Structured data for the attendance report.
 * @param {object} stream - Writable stream to pipe the PDF to (e.g., res object).
 */
export const generateProgramAttendancePDF = (reportData, stream) => {
    const doc = new PDFDocument({ margin: 30, layout: 'landscape' }); // Landscape for wide tables
    doc.pipe(stream);

    const { programName, reportDates, traineeReports, summaryStats } = reportData;

    // --- Report Header ---
    doc.fontSize(18).font('Helvetica-Bold').text(`Attendance Report for Program: ${programName}`, { align: 'center' });
    const startDateFormatted = reportDates.length > 0 ? new Date(reportDates[0]).toLocaleDateString() : 'N/A';
    const endDateFormatted = reportDates.length > 0 ? new Date(reportDates[reportDates.length - 1]).toLocaleDateString() : 'N/A';
    doc.fontSize(12).font('Helvetica').text(`Period: ${startDateFormatted} to ${endDateFormatted}`, { align: 'center' });
    doc.moveDown(1.5);

    // --- Summary Statistics ---
    doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').list([
        `Total Trainees: ${summaryStats.totalTrainees}`,
        `Total Class Days in Period: ${summaryStats.totalDaysInPeriod}`,
        `Overall Present Marks: ${summaryStats.totalPresentCount}`,
        `Overall Absent Marks: ${summaryStats.totalAbsentCount}`,
        `Overall Late Marks: ${summaryStats.totalLateCount}`,
        `Overall Excused Marks: ${summaryStats.totalExcusedCount}`
    ], { lineGap: 4 });
    doc.moveDown(1.5);

    // --- Table Headers & Body ---
    doc.fontSize(8); // Smaller font for table content

    const startX = 30;
    let currentY = doc.y;
    const traineeNameWidth = 90;
    const dateColumnWidth = 20; // Adjusted for smaller dates
    const summaryColumnWidth = 15;
    const padding = 2; // Internal cell padding

    const rowHeight = 25; // Height for each data row
    const headerHeight = 30; // Height for header row

    // Helper to draw a single cell
    const drawCell = (text, x, y, width, height, align = 'left', bgColor = null, textColor = null, bold = false) => {
        // Handle page breaks if content exceeds page height
        if (currentY + height > doc.page.height - doc.page.margins.bottom) {
            doc.addPage({ margin: 30, layout: 'landscape' });
            currentY = doc.page.margins.top;
            // Redraw headers on new page
            let headerX = startX;
            drawCell('Trainee Name', headerX, currentY, traineeNameWidth, headerHeight, 'left', '#E0E0E0', null, true);
            headerX += traineeNameWidth;

            reportDates.forEach(dateStr => {
                const date = new Date(dateStr);
                drawCell(date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }), headerX, currentY, dateColumnWidth, headerHeight, 'center', '#E0E0E0', null, true);
                headerX += dateColumnWidth;
            });
            drawCell('P', headerX, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); headerX += summaryColumnWidth;
            drawCell('L', headerX, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); headerX += summaryColumnWidth;
            drawCell('A', headerX, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); headerX += summaryColumnWidth;
            drawCell('E', headerX, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true);
            currentY += headerHeight;
        }

        if (bgColor) {
            doc.rect(x, y, width, height).fill(bgColor);
        }
        if (textColor) {
            doc.fillColor(textColor);
        } else {
            doc.fillColor('black');
        }
        if (bold) {
            doc.font('Helvetica-Bold');
        } else {
            doc.font('Helvetica');
        }
        doc.text(text, x + padding, y + padding, {
            width: width - 2 * padding,
            align,
            height: height - 2 * padding,
            valign: 'middle',
            lineBreak: false // Prevent text from wrapping inside narrow columns
        });
        doc.font('Helvetica'); // Reset font for next cell
        doc.fillColor('black'); // Reset color for next cell
    };

    // Draw header row
    let x = startX;
    drawCell('Trainee Name', x, currentY, traineeNameWidth, headerHeight, 'left', '#E0E0E0', null, true);
    x += traineeNameWidth;

    reportDates.forEach(dateStr => {
        const date = new Date(dateStr);
        drawCell(date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }), x, currentY, dateColumnWidth, headerHeight, 'center', '#E0E0E0', null, true);
        x += dateColumnWidth;
    });

    // Summary Headers (P, L, A, E)
    drawCell('P', x, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); x += summaryColumnWidth;
    drawCell('L', x, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); x += summaryColumnWidth;
    drawCell('A', x, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true); x += summaryColumnWidth;
    drawCell('E', x, currentY, summaryColumnWidth, headerHeight, 'center', '#E0E0E0', null, true);

    currentY += headerHeight;
    
    // Draw horizontal line after headers
    doc.lineWidth(0.5);
    doc.strokeColor('#CCCCCC');
    doc.moveTo(startX, currentY - 0.5).lineTo(x, currentY - 0.5).stroke();

    // Table Body
    traineeReports.forEach(tr => {
        x = startX; // Reset X for each row
        
        // Trainee Name Cell
        drawCell(tr.trainee.name, x, currentY, traineeNameWidth, rowHeight);
        x += traineeNameWidth;

        // Daily Attendance Cells
        tr.dailyAttendance.forEach(da => {
            let cellBg = null;
            let textColor = null;
            // Define colors for statuses
            if (da.status === 'Absent') { cellBg = '#FFDDDD'; textColor = '#FF0000'; } // Light red background, red text
            else if (da.status === 'Late') { cellBg = '#FFFFA0'; textColor = '#FFA500'; } // Light yellow background, orange text
            else if (da.status === 'Present') { cellBg = '#DDFFDD'; textColor = '#008000'; } // Light green background, green text
            else if (da.status === 'Excused') { cellBg = '#DDF0FF'; textColor = '#0000FF'; } // Light blue background, blue text

            drawCell(getStatusSymbol(da.status), x, currentY, dateColumnWidth, rowHeight, 'center', cellBg, textColor);
            x += dateColumnWidth;
        });

        // Summary Cells (counts)
        drawCell(tr.summary.present.toString(), x, currentY, summaryColumnWidth, rowHeight, 'center'); x += summaryColumnWidth;
        drawCell(tr.summary.late.toString(), x, currentY, summaryColumnWidth, rowHeight, 'center'); x += summaryColumnWidth;
        drawCell(tr.summary.absent.toString(), x, currentY, summaryColumnWidth, rowHeight, 'center'); x += summaryColumnWidth;
        drawCell(tr.summary.excused.toString(), x, currentY, summaryColumnWidth, rowHeight, 'center');

        currentY += rowHeight;
        // Draw horizontal line after each row
        doc.lineWidth(0.5);
        doc.strokeColor('#EEEEEE');
        doc.moveTo(startX, currentY - 0.5).lineTo(x, currentY - 0.5).stroke(); 
    });

    doc.end();
};