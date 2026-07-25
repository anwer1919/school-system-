const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ======== قاعدة البيانات ========
const db = new sqlite3.Database('./school.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, grade TEXT, section TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS fees (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, amount REAL, status TEXT, due_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, subject TEXT, score REAL, max_score REAL)`);
  db.run(`CREATE TABLE IF NOT EXISTS school_info (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, logo TEXT, address TEXT, phone TEXT, email TEXT, academic_year TEXT, branches TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS terms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, start_date TEXT, end_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades_levels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, level INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY AUTOINCREMENT, grade_id INTEGER, name TEXT, capacity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, code TEXT, grade_id INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, subject_id INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, type TEXT, capacity INTEGER)`);

  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('المدير العام', 'admin@school.com', '${hashedPassword}', 'admin')`);
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('أحمد محمد', 'الصف الأول', 'أ', 'نشط')`);
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('سارة علي', 'الصف الثاني', 'ب', 'نشط')`);
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('يوسف خالد', 'الصف الثالث', 'ج', 'نشط')`);
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (1, 'أحمد محمد', 5000, 'unpaid', '2026-09-01')`);
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (2, 'سارة علي', 5000, 'paid', '2026-09-01')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score) VALUES (1, 'أحمد محمد', 'الرياضيات', 95, 100)`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score) VALUES (1, 'أحمد محمد', 'العلوم', 88, 100)`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score) VALUES (2, 'سارة علي', 'الرياضيات', 92, 100)`);
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (1, 'أحمد محمد', '2026-07-26', 'present')`);
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (2, 'سارة علي', '2026-07-26', 'absent')`);
      db.run(`INSERT INTO school_info (name, logo, address, phone, email, academic_year, branches) VALUES ('مدرسة النور الخاصة', '🏫', 'القاهرة، مصر', '01234567890', 'info@alnoor.edu', '2026-2027', 'الفرع الرئيسي')`);
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الأول', '2026-09-01', '2027-01-15')`);
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الثاني', '2027-02-01', '2027-06-15')`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الأول', 1)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثاني', 2)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثالث', 3)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'أ', 30)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'ب', 30)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('الرياضيات', 'MATH101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('العلوم', 'SCI101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('اللغة العربية', 'ARA101', 1)`);
      db.run(`INSERT INTO teachers (name, email, phone, subject_id) VALUES ('أ. محمد أحمد', 'teacher@school.com', '01012345678', 1)`);
      db.run(`INSERT INTO teachers (name, email, phone, subject_id) VALUES ('أ. فاطمة علي', 'fatima@school.com', '01098765432', 2)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('القاعة 101', 'classroom', 30)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('معمل الحاسوب', 'lab', 25)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('المكتبة', 'library', 50)`);
      console.log("✅ تم إنشاء قاعدة البيانات والبيانات الأولية!");
    }
  });
});

// ======== الصفحة الرئيسية ========
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// ======== APIs ========

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: "بيانات غير صحيحة" });
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    res.json({ success: true, message: `مرحباً ${user.name}`, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

app.get('/api/students', (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => res.json({ success: true, count: rows.length, data: rows }));
});

app.post('/api/students', (req, res) => {
  const { name, grade, section } = req.body;
  db.run("INSERT INTO students (name, grade, section, status) VALUES (?, ?, ?, 'نشط')", [name, grade, section], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "تمت الإضافة", id: this.lastID });
  });
});

app.get('/api/fees', (req, res) => {
  db.all("SELECT * FROM fees", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/grades', (req, res) => {
  db.all("SELECT * FROM grades", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/teachers', (req, res) => {
  db.all("SELECT t.*, s.name as subject_name FROM teachers t LEFT JOIN subjects s ON t.subject_id = s.id", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/subjects', (req, res) => {
  db.all("SELECT * FROM subjects", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/school', (req, res) => {
  db.get("SELECT * FROM school_info", (err, row) => res.json({ success: true, data: row }));
});

app.get('/api/terms', (req, res) => {
  db.all("SELECT * FROM terms", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/sections', (req, res) => {
  db.all("SELECT s.*, g.name as grade_name FROM sections s JOIN grades_levels g ON s.grade_id = g.id", (err, rows) => res.json({ success: true, data: rows }));
});

app.get('/api/rooms', (req, res) => {
  db.all("SELECT * FROM rooms", (err, rows) => res.json({ success: true, data: rows }));
});

// ======== الشهادات ========
app.get('/certificate/:id', (req, res) => {
  const studentId = req.params.id;
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) return res.status(404).send("الطالب غير موجود");
    db.all("SELECT * FROM grades WHERE student_id = ?", [studentId], (err, grades) => {
      let totalScore = 0, totalMax = 0;
      grades.forEach(g => { totalScore += g.score; totalMax += g.max_score; });
      const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(2) : 0;
      const grade = percentage >= 90 ? 'ممتاز' : percentage >= 80 ? 'جيد جداً' : percentage >= 70 ? 'جيد' : percentage >= 60 ? 'مقبول' : 'ضعيف';
      
      res.send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>شهادة - ${student.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
body{font-family:'Amiri',serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);margin:0;padding:40px 20px;min-height:100vh}
.certificate{max-width:800px;margin:auto;background:white;padding:60px 40px;border:15px double #d4af37;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
.header{text-align:center;border-bottom:3px double #d4af37;padding-bottom:20px;margin-bottom:30px}
.header h1{color:#1e40af;font-size:42px;margin:0}
.title{text-align:center;font-size:36px;color:#d4af37;margin:30px 0;font-weight:bold}
.student-name{text-align:center;font-size:32px;color:#1e40af;margin:20px 0;border-bottom:2px solid #d4af37;display:inline-block;padding:0 40px 10px}
table{width:100%;border-collapse:collapse;margin:30px 0}
th{background:#1e40af;color:white;padding:12px;font-size:18px}
td{padding:12px;border:1px solid #ddd;text-align:center;font-size:16px}
.summary{background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0;text-align:center;font-size:20px}
.percentage{font-size:48px;color:#1e40af;font-weight:bold;margin:10px 0}
.grade-text{font-size:32px;color:#d4af37;font-weight:bold}
.print-btn{display:block;margin:20px auto;padding:15px 40px;background:#1e40af;color:white;border:none;border-radius:5px;font-size:18px;cursor:pointer}
@media print{body{background:white;padding:0}.print-btn{display:none}}
</style></head><body>
<div class="certificate">
<div class="header"><h1>🏫 مدرسة النور الخاصة</h1><p>Al-Noor Private School</p></div>
<div class="title">شهادة تقدير</div>
<div style="text-align:center"><p style="font-size:20px">تشهد المدرسة بأن الطالب</p><div class="student-name">${student.name}</div><p style="font-size:20px">بالصف ${student.grade} - شعبة ${student.section}</p></div>
<table><thead><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr></thead><tbody>
${grades.map(g => `<tr><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${((g.score/g.max_score)*100).toFixed(1)}%</td></tr>`).join('')}
</tbody></table>
<div class="summary"><div>المجموع الكلي</div><div class="percentage">${totalScore} / ${totalMax}</div><div>النسبة: ${percentage}%</div><div class="grade-text">التقدير: ${grade}</div></div>
</div>
<button class="print-btn" onclick="window.print()">🖨️ طباعة الشهادة</button>
</body></html>`);
    });
  });
});

// ======== التقارير (نصية بسيطة) ========
app.get('/api/reports/students', (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => {
    let html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير الطلاب</title>
<style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body>
<h1>📄 تقرير الطلاب</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
<table><tr><th>الرقم</th><th>الاسم</th><th>الصف</th><th>الشعبة</th><th>الحالة</th></tr>
${rows.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.status}</td></tr>`).join('')}
</table><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
    res.send(html);
  });
});

app.get('/api/reports/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (err, rows) => {
    let html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير الحضور</title>
<style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}.present{background:#d1fae5}.absent{background:#fee2e2}.late{background:#fef3c7}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body>
<h1>📅 تقرير الحضور والغياب</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
<table><tr><th>الرقم</th><th>الطالب</th><th>التاريخ</th><th>الحالة</th></tr>
${rows.map(a => {
  const status = a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : 'متأخر';
  const cls = a.status;
  return `<tr class="${cls}"><td>${a.id}</td><td>${a.student_name}</td><td>${a.date}</td><td>${status}</td></tr>`;
}).join('')}
</table><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
    res.send(html);
  });
});

app.get('/api/reports/fees', (req, res) => {
  db.all("SELECT * FROM fees", (err, rows) => {
    let total = 0, paid = 0;
    rows.forEach(f => { total += f.amount; if (f.status === 'paid') paid += f.amount; });
    let html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي</title>
<style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}.paid{background:#d1fae5}.unpaid{background:#fee2e2}.summary{background:#f0f9ff;padding:20px;border-radius:10px;margin:20px 0;text-align:center}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body>
<h1>💰 التقرير المالي</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
<div class="summary"><h2>إجمالي الرسوم: ${total} جنيه</h2><h2>المدفوع: ${paid} جنيه</h2><h2>المتبقي: ${total - paid} جنيه</h2></div>
<table><tr><th>الرقم</th><th>الطالب</th><th>المبلغ</th><th>تاريخ الاستحقاق</th><th>الحالة</th></tr>
${rows.map(f => {
  const status = f.status === 'paid' ? 'مدفوع' : 'غير مدفوع';
  const cls = f.status;
  return `<tr class="${cls}"><td>${f.id}</td><td>${f.student_name}</td><td>${f.amount} جنيه</td><td>${f.due_date}</td><td>${status}</td></tr>`;
}).join('')}
</table><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
    res.send(html);
  });
});

app.get('/api/reports/grades', (req, res) => {
  db.all("SELECT * FROM grades", (err, rows) => {
    let html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير الدرجات</title>
<style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body>
<h1>🎯 تقرير الدرجات</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
<table><tr><th>الطالب</th><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>التقدير</th></tr>
${rows.map(g => {
  const p = ((g.score/g.max_score)*100).toFixed(1);
  const grade = p >= 90 ? 'ممتاز' : p >= 80 ? 'جيد جداً' : p >= 70 ? 'جيد' : p >= 60 ? 'مقبول' : 'ضعيف';
  return `<tr><td>${g.student_name}</td><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${p}%</td><td>${grade}</td></tr>`;
}).join('')}
</table><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
    res.send(html);
  });
});

// ======== تشغيل الخادم ========
app.listen(PORT, () => {
  console.log(`🚀 النظام يعمل على المنفذ ${PORT}`);
  console.log(`🌐 افتح الرابط من تبويب Ports`);
});
