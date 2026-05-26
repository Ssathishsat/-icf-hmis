const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { authenticateToken } = require('../middleware/auth');
const { restrictToOwnShop } = require('../middleware/rbac');

// Helper: fetch report data
async function fetchReportData(filters) {
  const { from_date, to_date, shop_code, status, category } = filters;
  const fromDate = from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = to_date || new Date().toISOString().split('T')[0];

  const conditions = ['r.sick_date BETWEEN ? AND ?'];
  const params = [fromDate, toDate];

  if (shop_code) { conditions.push('e.shop_code = ?'); params.push(shop_code); }
  if (status === 'Active') {
    conditions.push('r.fit_date IS NULL');
  } else if (status === 'Resolved' || status === 'Recovered' || status === 'Fit') {
    conditions.push('r.fit_date IS NOT NULL');
  }
  if (category) { conditions.push('e.category = ?'); params.push(category); }

  const [rows] = await pool.execute(`
    SELECT
      e.EMISCARDNUMBER, e.emp_name, e.designation, e.department,
      e.shop_code, s.shop_name, e.category,
      r.status, r.sick_date, r.fit_date, r.days_count,
      r.diagnosis, r.reporting_doctor, r.hospital_name, r.remarks
    FROM sick_fit_records r
    JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
    LEFT JOIN shops s ON e.shop_code = s.shop_code
    WHERE ${conditions.join(' AND ')}
    ORDER BY r.sick_date DESC
  `, params);

  return { rows, fromDate, toDate };
}

// GET /api/reports/export/excel
router.get('/export/excel', authenticateToken, restrictToOwnShop, async (req, res) => {
  try {
    const { rows, fromDate, toDate } = await fetchReportData(req.query);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ICF HMIS System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Sick-Fit Report', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Header styling
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      }
    };

    // Title row
    sheet.mergeCells('A1:O1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ICF HMIS – Sick/Fit Monitoring Report';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF003366' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:O2');
    sheet.getCell('A2').value = `Period: ${fromDate} to ${toDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([]);

    // Column headers
    const headers = [
      'EMISCARDNUMBER', 'Employee Name', 'Designation', 'Department',
      'Shop Code', 'Shop Name', 'Category', 'Status',
      'Sick Date', 'Fit Date', 'Days', 'Diagnosis',
      'Reporting Doctor', 'Hospital', 'Remarks'
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell(cell => Object.assign(cell, headerStyle));
    sheet.getRow(4).height = 25;

    // Column widths
    const widths = [18, 25, 20, 18, 12, 20, 18, 10, 14, 14, 8, 25, 22, 22, 20];
    widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    // Data rows
    rows.forEach((row, idx) => {
      const dataRow = sheet.addRow([
        row.EMISCARDNUMBER, row.emp_name, row.designation, row.department,
        row.shop_code, row.shop_name, row.category, row.status,
        row.sick_date ? new Date(row.sick_date).toLocaleDateString('en-IN') : '',
        row.fit_date ? new Date(row.fit_date).toLocaleDateString('en-IN') : 'Ongoing',
        row.days_count || '', row.diagnosis || '',
        row.reporting_doctor || '', row.hospital_name || '', row.remarks || ''
      ]);

      // Alternate row colors
      if (idx % 2 === 0) {
        dataRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        });
      }

      // Status color
      const statusCell = dataRow.getCell(8);
      statusCell.font = {
        bold: true,
        color: { argb: row.status === 'Sick' ? 'FFCC0000' : 'FF006600' }
      };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ICF_HMIS_Report_${fromDate}_${toDate}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// GET /api/reports/export/pdf
router.get('/export/pdf', authenticateToken, restrictToOwnShop, async (req, res) => {
  try {
    const { rows, fromDate, toDate } = await fetchReportData(req.query);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ICF_HMIS_Report_${fromDate}_${toDate}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#003366');
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
       .text('ICF HMIS – Sick/Fit Monitoring Report', 40, 20, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
       .text(`Principal Chief Medical Officer – Workforce Health Analytics`, 40, 45, { align: 'center' });
    doc.fontSize(10)
       .text(`Report Period: ${fromDate} to ${toDate}  |  Generated: ${new Date().toLocaleString('en-IN')}`, 40, 62, { align: 'center' });

    doc.moveDown(3);
    doc.fillColor('#003366').fontSize(12).font('Helvetica-Bold')
       .text(`Total Records: ${rows.length}`, 40, 95);

    // Table
    const tableTop = 120;
    const colWidths = [90, 120, 90, 70, 70, 60, 70, 70];
    const colHeaders = ['EMIS No.', 'Employee Name', 'Designation', 'Shop', 'Category', 'Status', 'Sick Date', 'Fit Date'];

    // Table header
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#003366');
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
    let x = 40;
    colHeaders.forEach((h, i) => {
      doc.text(h, x + 2, tableTop + 5, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });

    // Table rows
    let y = tableTop + 20;
    rows.slice(0, 40).forEach((row, idx) => {
      if (y > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }
      const bg = idx % 2 === 0 ? '#F0F4FF' : '#FFFFFF';
      doc.rect(40, y, doc.page.width - 80, 18).fill(bg);
      doc.fillColor('#333333').fontSize(7).font('Helvetica');
      x = 40;
      const rowData = [
        row.EMISCARDNUMBER, row.emp_name, row.designation,
        row.shop_code, row.category, row.status,
        row.sick_date ? new Date(row.sick_date).toLocaleDateString('en-IN') : '',
        row.fit_date ? new Date(row.fit_date).toLocaleDateString('en-IN') : 'Ongoing'
      ];
      rowData.forEach((val, i) => {
        if (i === 5) {
          doc.fillColor(val === 'Sick' ? '#CC0000' : '#006600').font('Helvetica-Bold');
        } else {
          doc.fillColor('#333333').font('Helvetica');
        }
        doc.text(String(val || ''), x + 2, y + 4, { width: colWidths[i] - 4, ellipsis: true });
        x += colWidths[i];
      });
      y += 18;
    });

    if (rows.length > 40) {
      doc.moveDown().fillColor('#666666').fontSize(9)
         .text(`... and ${rows.length - 40} more records. Download Excel for complete data.`);
    }

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ success: false, message: 'PDF export failed' });
  }
});

module.exports = router;
