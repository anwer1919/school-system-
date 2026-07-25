const PDFDocument = require('pdfkit');
const db = require('./database');

// توليد تقرير الطلاب PDF
function generateStudentsReport(res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=students-report.pdf');
  
  doc.pipe(res);
  
  // العنوان
  doc.fontSize(20).text('تقرير الطلاب', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, { align: 'center' });
  doc.moveDown(2);
  
  // جلب البيانات
  db.all("SELECT * FROM students", (err, rows) => {
    if (err) {
      doc.text('حدث خطأ في جلب البيانات');
      doc.end();
      return;
    }
    
    // رؤوس الجدول
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('الرقم', 50, doc.y, { continued: true });
    doc.text('الاسم', 150, doc.y, { continued: true });
    doc.text('الصف', 300, doc.y, { continued: true });
    doc.text('الشعبة', 400, doc.y, { continued: true });
    doc.text('الحالة', 500, doc.y);
    doc.moveDown();
    
    // خط فاصل
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    // البيانات
    doc.font('Helvetica');
    rows.forEach(student => {
      doc.text(student.id.toString(), 50, doc.y, { continued: true });
      doc.text(student.name, 150, doc.y, { continued: true });
      doc.text(student.grade, 300, doc.y, { continued: true });
      doc.text(student.section, 400, doc.y, { continued: true });
      doc.text(student.status, 500, doc.y);
      doc.moveDown();
    });
    
    doc.end();
  });
}

// توليد تقرير الحضور PDF
function generateAttendanceReport(res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
  
  doc.pipe(res);
  
  doc.fontSize(20).text('تقرير الحضور والغياب', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, { align: 'center' });
  doc.moveDown(2);
  
  db.all("SELECT * FROM attendance", (err, rows) => {
    if (err) {
      doc.text('حدث خطأ في جلب البيانات');
      doc.end();
      return;
    }
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('الرقم', 50, doc.y, { continued: true });
    doc.text('الطالب', 150, doc.y, { continued: true });
    doc.text('التاريخ', 300, doc.y, { continued: true });
    doc.text('الحالة', 450, doc.y);
    doc.moveDown();
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    doc.font('Helvetica');
    rows.forEach(record => {
      doc.text(record.id.toString(), 50, doc.y, { continued: true });
      doc.text(record.student_name, 150, doc.y, { continued: true });
      doc.text(record.date, 300, doc.y, { continued: true });
      doc.text(record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'متأخر', 450, doc.y);
      doc.moveDown();
    });
    
    doc.end();
  });
}

module.exports = { generateStudentsReport, generateAttendanceReport };
