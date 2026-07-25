// certificate.js - نظام الشهادات
const db = require('./database');

// جلب بيانات الطالب مع درجاته
function getStudentCertificate(studentId) {
  return new Promise((resolve, reject) => {
    // جلب بيانات الطالب
    db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
      if (err || !student) return reject("الطالب غير موجود");

      // جلب درجاته
      db.all("SELECT * FROM grades WHERE student_id = ?", [studentId], (err, grades) => {
        if (err) return reject(err);

        // حساب المجموع والنسبة
        let totalScore = 0;
        let totalMax = 0;
        grades.forEach(g => {
          totalScore += g.score;
          totalMax += g.max_score;
        });

        const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(2) : 0;
        const grade = percentage >= 90 ? 'ممتاز' : percentage >= 80 ? 'جيد جداً' : percentage >= 70 ? 'جيد' : percentage >= 60 ? 'مقبول' : 'ضعيف';

        resolve({
          student,
          grades,
          totalScore,
          totalMax,
          percentage,
          grade,
          date: new Date().toLocaleDateString('ar-EG')
        });
      });
    });
  });
}

// توليد HTML للشهادة
function generateCertificateHTML(data) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>شهادة تقدير - ${data.student.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        body {
          font-family: 'Amiri', serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 40px 20px;
          min-height: 100vh;
        }
        .certificate {
          max-width: 800px;
          margin: auto;
          background: white;
          padding: 60px 40px;
          border: 15px double #d4af37;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 20px; left: 20px; right: 20px; bottom: 20px;
          border: 2px solid #d4af37;
          pointer-events: none;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #d4af37;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          font-size: 42px;
          margin: 0;
        }
        .header p {
          color: #666;
          font-size: 18px;
          margin: 10px 0 0;
        }
        .title {
          text-align: center;
          font-size: 36px;
          color: #d4af37;
          margin: 30px 0;
          font-weight: bold;
        }
        .student-name {
          text-align: center;
          font-size: 32px;
          color: #1e40af;
          margin: 20px 0;
          border-bottom: 2px solid #d4af37;
          display: inline-block;
          padding: 0 40px 10px;
        }
        .grades-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        .grades-table th {
          background: #1e40af;
          color: white;
          padding: 12px;
          font-size: 18px;
        }
        .grades-table td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: center;
          font-size: 16px;
        }
        .grades-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        .summary {
          background: #fef3c7;
          padding: 20px;
          border-radius: 10px;
          margin: 30px 0;
          text-align: center;
          font-size: 20px;
        }
        .summary .percentage {
          font-size: 48px;
          color: #1e40af;
          font-weight: bold;
          margin: 10px 0;
        }
        .summary .grade {
          font-size: 32px;
          color: #d4af37;
          font-weight: bold;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #d4af37;
        }
        .signature {
          text-align: center;
        }
        .signature .line {
          border-top: 2px solid #333;
          width: 200px;
          margin: 10px auto;
        }
        .print-btn {
          display: block;
          margin: 20px auto;
          padding: 15px 40px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 18px;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #1e3a8a;
        }
        @media print {
          body { background: white; padding: 0; }
          .certificate { box-shadow: none; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <h1>🏫 مدرسة النور الخاصة</h1>
          <p>Al-Noor Private School</p>
        </div>

        <div class="title">شهادة تقدير</div>

        <div style="text-align:center;">
          <p style="font-size: 20px;">تشهد المدرسة بأن الطالب</p>
          <div class="student-name">${data.student.name}</div>
          <p style="font-size: 20px;">بالصف ${data.student.grade} - شعبة ${data.student.section}</p>
        </div>

        <table class="grades-table">
          <thead>
            <tr>
              <th>المادة</th>
              <th>الدرجة</th>
              <th>من</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${data.grades.map(g => `
              <tr>
                <td>${g.subject}</td>
                <td>${g.score}</td>
                <td>${g.max_score}</td>
                <td>${((g.score / g.max_score) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div>المجموع الكلي</div>
          <div class="percentage">${data.totalScore} / ${data.totalMax}</div>
          <div>النسبة المئوية: ${data.percentage}%</div>
          <div class="grade">التقدير: ${data.grade}</div>
        </div>

        <div class="footer">
          <div class="signature">
            <p>التاريخ</p>
            <div class="line"></div>
            <p>${data.date}</p>
          </div>
          <div class="signature">
            <p>توقيع المدير</p>
            <div class="line"></div>
            <p>_________________</p>
          </div>
        </div>
      </div>

      <button class="print-btn" onclick="window.print()">🖨️ طباعة الشهادة</button>
    </body>
    </html>
  `;
}

module.exports = { getStudentCertificate, generateCertificateHTML };
