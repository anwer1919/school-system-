const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./school.db');

// ======== إنشاء كل الجداول ========
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, phone TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS school_info (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, logo TEXT, address TEXT, phone TEXT, email TEXT, academic_year TEXT, branches TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS terms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, start_date TEXT, end_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades_levels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, level INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY AUTOINCREMENT, grade_id INTEGER, name TEXT, capacity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, type TEXT, capacity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, code TEXT, grade_id INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, subject_id INTEGER, salary REAL)`);
  db.run(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, role TEXT, salary REAL)`);
  db.run(`CREATE TABLE IF NOT EXISTS parents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, address TEXT, job TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, grade TEXT, section TEXT, status TEXT, parent_id INTEGER, seat_number TEXT, birth_date TEXT, gender TEXT, medical_notes TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS fees (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, amount REAL, status TEXT, due_date TEXT, type TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, subject TEXT, score REAL, max_score REAL, exam_type TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, subject TEXT, grade TEXT, date TEXT, max_score REAL, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT, period INTEGER, subject TEXT, teacher TEXT, section TEXT, room TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS revenue (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, amount REAL, date TEXT, notes TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, amount REAL, date TEXT, notes TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, recipient TEXT, message TEXT, date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, action TEXT, details TEXT, date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS clinic (id INTEGER PRIMARY KEY AUTOINCREMENT, student_name TEXT, date TEXT, complaint TEXT, treatment TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS transport (id INTEGER PRIMARY KEY AUTOINCREMENT, bus_name TEXT, route TEXT, driver TEXT, capacity INTEGER, students_count INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY AUTOINCREMENT, book_title TEXT, author TEXT, isbn TEXT, status TEXT, borrower TEXT, due_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT, category TEXT, quantity INTEGER, location TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS calendar_events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, date TEXT, type TEXT, description TEXT)`);

  // ======== بيانات أولية ========
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hp = bcrypt.hashSync("admin123", 10);
      // مستخدمين
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('المدير العام','admin@school.com','${hp}','مدير','01000000001')`);
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('الوكيل','wakeel@school.com','${hp}','وكيل','01000000002')`);
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('الكنترول','control@school.com','${hp}','كنترول','01000000003')`);
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('شؤون الطلاب','affairs@school.com','${hp}','شؤون طلاب','01000000004')`);
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('المحاسب','accountant@school.com','${hp}','محاسب','01000000005')`);
      // مدرسة
      db.run(`INSERT INTO school_info (name,logo,address,phone,email,academic_year,branches) VALUES ('مدرسة النور الخاصة','🏫','القاهرة، مصر','01234567890','info@alnoor.edu','2026-2027','الفرع الرئيسي - فرع المعادي')`);
      // فصول
      db.run(`INSERT INTO terms (name,start_date,end_date) VALUES ('الفصل الأول','2026-09-01','2027-01-15')`);
      db.run(`INSERT INTO terms (name,start_date,end_date) VALUES ('الفصل الثاني','2027-02-01','2027-06-15')`);
      // صفوف وشعب
      db.run(`INSERT INTO grades_levels (name,level) VALUES ('الصف الأول',1)`);
      db.run(`INSERT INTO grades_levels (name,level) VALUES ('الصف الثاني',2)`);
      db.run(`INSERT INTO grades_levels (name,level) VALUES ('الصف الثالث',3)`);
      db.run(`INSERT INTO sections (grade_id,name,capacity) VALUES (1,'أ',30),(1,'ب',30),(2,'أ',30),(3,'أ',30)`);
      // قاعات
      db.run(`INSERT INTO rooms (name,type,capacity) VALUES ('القاعة 101','قاعة',30),('القاعة 102','قاعة',30),('معمل الحاسوب','معمل',25),('معمل العلوم','معمل',25),('المكتبة','مكتبة',50),('قاعة الامتحانات','قاعة',100)`);
      // مواد
      db.run(`INSERT INTO subjects (name,code,grade_id) VALUES ('الرياضيات','MATH',1),('العلوم','SCI',1),('اللغة العربية','ARA',1),('اللغة الإنجليزية','ENG',1),('التاريخ','HIS',2)`);
      // معلمين
      db.run(`INSERT INTO teachers (name,email,phone,subject_id,salary) VALUES ('أ. محمد أحمد','mohamed@school.com','01011111111',1,8000),('أ. فاطمة علي','fatima@school.com','01022222222',2,7500),('أ. خالد حسن','khaled@school.com','01033333333',3,7000)`);
      // موظفين
      db.run(`INSERT INTO employees (name,email,phone,role,salary) VALUES ('سمير عبد الله','sameer@school.com','01044444444','سائق',4000),('نادية محمد','nadia@school.com','01055555555','أمن',3500)`);
      // أولياء أمور
      db.run(`INSERT INTO parents (name,email,phone,address,job) VALUES ('أ. عبد الله محمد','abdullah@email.com','01111111111','القاهرة - المعادي','مهندس'),('أ. علي حسن','ali@email.com','01122222222','القاهرة - مدينة نصر','طبيب')`);
      // طلاب
      db.run(`INSERT INTO students (name,grade,section,status,parent_id,seat_number,birth_date,gender) VALUES ('أحمد محمد','الصف الأول','أ','نشط',1,'A1','2015-03-15','ذكر')`);
      db.run(`INSERT INTO students (name,grade,section,status,parent_id,seat_number,birth_date,gender) VALUES ('سارة علي','الصف الثاني','أ','نشط',2,'B3','2014-07-20','أنثى')`);
      db.run(`INSERT INTO students (name,grade,section,status,parent_id,seat_number,birth_date,gender) VALUES ('يوسف خالد','الصف الثالث','أ','نشط',1,'C5','2013-11-10','ذكر')`);
      // حضور
      db.run(`INSERT INTO attendance (student_id,student_name,date,status) VALUES (1,'أحمد محمد','2026-07-26','present'),(2,'سارة علي','2026-07-26','absent'),(3,'يوسف خالد','2026-07-26','late')`);
      // رسوم
      db.run(`INSERT INTO fees (student_id,student_name,amount,status,due_date,type) VALUES (1,'أحمد محمد',5000,'unpaid','2026-09-01','رسوم دراسية'),(2,'سارة علي',5000,'paid','2026-09-01','رسوم دراسية'),(1,'أحمد محمد',500,'paid','2026-09-15','رسوم باص')`);
      // درجات
      db.run(`INSERT INTO grades (student_id,student_name,subject,score,max_score,exam_type) VALUES (1,'أحمد محمد','الرياضيات',95,100,'نهائي'),(1,'أحمد محمد','العلوم',88,100,'نهائي'),(2,'سارة علي','الرياضيات',92,100,'نهائي'),(3,'يوسف خالد','اللغة العربية',78,100,'نهائي')`);
      // امتحانات
      db.run(`INSERT INTO exams (name,subject,grade,date,max_score,status) VALUES ('امتحان نصف العام - رياضيات','الرياضيات','الصف الأول','2027-01-10',100,'مكتمل'),('امتحان نصف العام - علوم','العلوم','الصف الأول','2027-01-12',100,'قادم')`);
      // جدول حصص
      db.run(`INSERT INTO schedules (day,period,subject,teacher,section,room) VALUES ('الأحد',1,'الرياضيات','أ. محمد أحمد','أ','القاعة 101'),('الأحد',2,'العلوم','أ. فاطمة علي','أ','معمل العلوم'),('الاثنين',1,'اللغة العربية','أ. خالد حسن','أ','القاعة 102'),('الاثنين',2,'الإنجليزية','أ. فاطمة علي','أ','القاعة 101')`);
      // إيرادات ومصروفات
      db.run(`INSERT INTO revenue (source,amount,date,notes) VALUES ('رسوم دراسية',5000,'2026-07-01','دفعة سارة علي'),('رسوم باص',500,'2026-07-15','دفعة أحمد')`);
      db.run(`INSERT INTO expenses (category,amount,date,notes) VALUES ('رواتب',22500,'2026-07-01','رواتب يوليو'),('صيانة',1500,'2026-07-10','صيانة مكيفات')`);
      // عيادة
      db.run(`INSERT INTO clinic (student_name,date,complaint,treatment) VALUES ('أحمد محمد','2026-07-20','صداع','باراسيتامول + راحة')`);
      // نقل
      db.run(`INSERT INTO transport (bus_name,route,driver,capacity,students_count) VALUES ('باص 1','المعادي - المدرسة','سمير عبد الله',25,18),('باص 2','مدينة نصر - المدرسة','خالد علي',30,22)`);
      // مكتبة
      db.run(`INSERT INTO library (book_title,author,isbn,status,borrower,due_date) VALUES ('الرياضيات للصف الأول','د. أحمد','978-123','مُعار','أحمد محمد','2026-08-01'),('قصة نور المعرفة','سارة أحمد','978-456','متاح',NULL,NULL)`);
      // مخازن
      db.run(`INSERT INTO inventory (item_name,category,quantity,location) VALUES ('كتاب الرياضيات','كتب',200,'المخزن الرئيسي'),('أقلام سبورة','أدوات',50,'غرفة المعلمين')`);
      // تقويم
      db.run(`INSERT INTO calendar_events (title,date,type,description) VALUES ('بداية العام الدراسي','2026-09-01','أكاديمي','أول يوم دراسي'),('امتحانات نصف العام','2027-01-10','امتحان','بداية امتحانات الترم الأول')`);
      // إعدادات
      db.run(`INSERT INTO settings (key,value) VALUES ('school_name','مدرسة النور الخاصة'),('school_phone','01234567890'),('school_email','info@alnoor.edu'),('whatsapp_enabled','false'),('email_enabled','false')`);
      // سجل نشاط
      db.run(`INSERT INTO audit_log (user_name,action,details,date) VALUES ('المدير العام','تسجيل دخول','دخول ناجح','2026-07-26 08:00')`);
      console.log("✅ تم إنشاء كل الجداول والبيانات!");
    }
  });
});

// ======== Middleware: سجل النشاط ========
function logAction(user, action, details) {
  const date = new Date().toLocaleString('ar-EG');
  db.run("INSERT INTO audit_log (user_name,action,details,date) VALUES (?,?,?,?)", [user, action, details, date]);
}

// ======== صفحات ========
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// ======== APIs: تسجيل الدخول ========
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: "بيانات غير صحيحة" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    logAction(user.name, 'تسجيل دخول', 'دخول ناجح');
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

// ======== API عام لجلب أي جدول ========
const tables = ['students','teachers','employees','parents','attendance','fees','grades','exams','schedules','revenue','expenses','notifications','audit_log','school_info','terms','grades_levels','sections','rooms','subjects','clinic','transport','library','inventory','calendar_events','settings'];
tables.forEach(table => {
  app.get(`/api/${table}`, (req, res) => {
    if (table === 'school_info') {
      db.get(`SELECT * FROM ${table}`, (err, row) => res.json({ success: true, data: row }));
    } else {
      db.all(`SELECT * FROM ${table}`, (err, rows) => res.json({ success: true, count: rows?.length || 0, data: rows || [] }));
    }
  });
});

// ======== APIs: إضافة بيانات ========
app.post('/api/students', (req, res) => {
  const { name, grade, section, parent_id, seat_number, birth_date, gender } = req.body;
  db.run("INSERT INTO students (name,grade,section,status,parent_id,seat_number,birth_date,gender) VALUES (?,?,?,?,?,?,?,?)", [name, grade, section, 'نشط', parent_id, seat_number, birth_date, gender], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    logAction('المدير', 'إضافة طالب', name);
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/attendance', (req, res) => {
  const { student_id, student_name, date, status } = req.body;
  db.run("INSERT INTO attendance (student_id,student_name,date,status) VALUES (?,?,?,?)", [student_id, student_name, date, status], function(err) {
    if (err) return res.status(500).json({ success: false });
    if (status === 'absent') {
      db.run("INSERT INTO notifications (type,recipient,message,date,status) VALUES (?,?,?,?,?)", ['WhatsApp', 'ولي الأمر', `غياب ${student_name} اليوم`, new Date().toLocaleDateString('ar-EG'), 'مرسل']);
    }
    logAction('المعلم', 'تسجيل حضور', `${student_name}: ${status}`);
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/grades', (req, res) => {
  const { student_id, student_name, subject, score, max_score, exam_type } = req.body;
  db.run("INSERT INTO grades (student_id,student_name,subject,score,max_score,exam_type) VALUES (?,?,?,?,?,?)", [student_id, student_name, subject, score, max_score, exam_type], function(err) {
    if (err) return res.status(500).json({ success: false });
    logAction('الكنترول', 'رصد درجة', `${student_name} - ${subject}: ${score}`);
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/fees', (req, res) => {
  const { student_id, student_name, amount, due_date, type } = req.body;
  db.run("INSERT INTO fees (student_id,student_name,amount,status,due_date,type) VALUES (?,?,?,?,?,?)", [student_id, student_name, amount, 'unpaid', due_date, type], function(err) {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/expenses', (req, res) => {
  const { category, amount, date, notes } = req.body;
  db.run("INSERT INTO expenses (category,amount,date,notes) VALUES (?,?,?,?)", [category, amount, date, notes], function(err) {
    if (err) return res.status(500).json({ success: false });
    logAction('المحاسب', 'إضافة مصروف', `${category}: ${amount}`);
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/clinic', (req, res) => {
  const { student_name, date, complaint, treatment } = req.body;
  db.run("INSERT INTO clinic (student_name,date,complaint,treatment) VALUES (?,?,?,?)", [student_name, date, complaint, treatment], function(err) {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, id: this.lastID });
  });
});

// ======== الشهادات ========
app.get('/certificate/:id', (req, res) => {
  db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (err, student) => {
    if (err || !student) return res.status(404).send("الطالب غير موجود");
    db.all("SELECT * FROM grades WHERE student_id = ?", [req.params.id], (err, grades) => {
      let ts = 0, tm = 0;
      grades.forEach(g => { ts += g.score; tm += g.max_score; });
      const p = tm > 0 ? ((ts / tm) * 100).toFixed(2) : 0;
      const g = p >= 90 ? 'ممتاز' : p >= 80 ? 'جيد جداً' : p >= 70 ? 'جيد' : p >= 60 ? 'مقبول' : 'ضعيف';
      res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>شهادة - ${student.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');body{font-family:'Amiri',serif;background:linear-gradient(135deg,#667eea,#764ba2);margin:0;padding:40px 20px}.cert{max-width:800px;margin:auto;background:white;padding:60px 40px;border:15px double #d4af37;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.3)}.hdr{text-align:center;border-bottom:3px double #d4af37;padding-bottom:20px;margin-bottom:30px}.hdr h1{color:#1e40af;font-size:42px;margin:0}.ttl{text-align:center;font-size:36px;color:#d4af37;margin:30px 0;font-weight:bold}.sn{text-align:center;font-size:32px;color:#1e40af;margin:20px 0;border-bottom:2px solid #d4af37;display:inline-block;padding:0 40px 10px}table{width:100%;border-collapse:collapse;margin:30px 0}th{background:#1e40af;color:white;padding:12px}td{padding:12px;border:1px solid #ddd;text-align:center}.sum{background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0;text-align:center;font-size:20px}.pct{font-size:48px;color:#1e40af;font-weight:bold}.grd{font-size:32px;color:#d4af37;font-weight:bold}.pbtn{display:block;margin:20px auto;padding:15px 40px;background:#1e40af;color:white;border:none;border-radius:5px;font-size:18px;cursor:pointer}@media print{body{background:white;padding:0}.pbtn{display:none}}</style></head><body><div class="cert"><div class="hdr"><h1>🏫 مدرسة النور الخاصة</h1><p>Al-Noor Private School</p></div><div class="ttl">شهادة تقدير</div><div style="text-align:center"><p style="font-size:20px">تشهد المدرسة بأن الطالب</p><div class="sn">${student.name}</div><p style="font-size:20px">الصف ${student.grade} - شعبة ${student.section} - رقم الجلوس ${student.seat_number || 'غير محدد'}</p></div><table><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr>${grades.map(g=>`<tr><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${((g.score/g.max_score)*100).toFixed(1)}%</td></tr>`).join('')}</table><div class="sum"><div>المجموع</div><div class="pct">${ts}/${tm}</div><div>النسبة: ${p}%</div><div class="grd">التقدير: ${g}</div></div></div><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
    });
  });
});

// ======== التقارير ========
function makeReport(title, headers, rows, extra = '') {
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border:1px solid #ddd;text-align:center}.pbtn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px}@media print{.pbtn{display:none}}</style></head><body><h1>${title}</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>${extra}<table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rows}</table><button class="pbtn" onclick="window.print()">🖨️ طباعة التقرير</button></body></html>`;
}

app.get('/api/reports/students', (req, res) => {
  db.all("SELECT s.*, p.name as parent_name FROM students s LEFT JOIN parents p ON s.parent_id = p.id", (err, rows) => {
    const r = rows.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.seat_number||'-'}</td><td>${s.parent_name||'-'}</td><td>${s.status}</td></tr>`).join('');
    res.send(makeReport('📄 تقرير الطلاب', ['الرقم','الاسم','الصف','الشعبة','رقم الجلوس','ولي الأمر','الحالة'], r));
  });
});

app.get('/api/reports/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (err, rows) => {
    const r = rows.map(a => { const s = a.status==='present'?'حاضر':a.status==='absent'?'غائب':'متأخر'; return `<tr><td>${a.student_name}</td><td>${a.date}</td><td>${s}</td></tr>`; }).join('');
    res.send(makeReport('📅 تقرير الحضور', ['الطالب','التاريخ','الحالة'], r));
  });
});

app.get('/api/reports/fees', (req, res) => {
  db.all("SELECT * FROM fees", (err, rows) => {
    let total=0,paid=0; rows.forEach(f=>{total+=f.amount;if(f.status==='paid')paid+=f.amount;});
    const r = rows.map(f => `<tr><td>${f.student_name}</td><td>${f.amount}</td><td>${f.type}</td><td>${f.due_date}</td><td>${f.status==='paid'?'مدفوع':'غير مدفوع'}</td></tr>`).join('');
    res.send(makeReport('💰 التقرير المالي', ['الطالب','المبلغ','النوع','الاستحقاق','الحالة'], r, `<div style="background:#f0f9ff;padding:15px;border-radius:10px;text-align:center;margin:20px 0"><b>الإجمالي: ${total} | المدفوع: ${paid} | المتبقي: ${total-paid}</b></div>`));
  });
});

app.get('/api/reports/grades', (req, res) => {
  db.all("SELECT * FROM grades", (err, rows) => {
    const r = rows.map(g => { const p=((g.score/g.max_score)*100).toFixed(1); const gr=p>=90?'ممتاز':p>=70?'جيد':'مقبول'; return `<tr><td>${g.student_name}</td><td>${g.subject}</td><td>${g.exam_type}</td><td>${g.score}/${g.max_score}</td><td>${p}%</td><td>${gr}</td></tr>`; }).join('');
    res.send(makeReport('🎯 كشوف الدرجات', ['الطالب','المادة','نوع الامتحان','الدرجة','النسبة','التقدير'], r));
  });
});

app.get('/api/reports/teachers', (req, res) => {
  db.all("SELECT t.*, s.name as subject_name FROM teachers t LEFT JOIN subjects s ON t.subject_id = s.id", (err, rows) => {
    const r = rows.map(t => `<tr><td>${t.name}</td><td>${t.subject_name||'-'}</td><td>${t.email}</td><td>${t.phone}</td><td>${t.salary}</td></tr>`).join('');
    res.send(makeReport('👨‍🏫 تقرير المعلمين', ['الاسم','المادة','البريد','الهاتف','الراتب'], r));
  });
});

app.get('/api/reports/financial', (req, res) => {
  db.all("SELECT * FROM revenue", (err, rev) => {
    db.all("SELECT * FROM expenses", (err2, exp) => {
      let tr=0,te=0; rev.forEach(r=>tr+=r.amount); exp.forEach(e=>te+=e.amount);
      const rr = rev.map(r=>`<tr><td>${r.source}</td><td>${r.amount}</td><td>${r.date}</td></tr>`).join('');
      const er = exp.map(e=>`<tr><td>${e.category}</td><td>${e.amount}</td><td>${e.date}</td></tr>`).join('');
      res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي الشامل</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}h2{color:#1e40af;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border:1px solid #ddd;text-align:center}.sum{background:#f0f9ff;padding:15px;border-radius:10px;text-align:center;margin:20px 0}.pbtn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.pbtn{display:none}}</style></head><body><h1>💰 التقرير المالي الشامل</h1><div class="sum"><b>إجمالي الإيرادات: ${tr} جنيه | إجمالي المصروفات: ${te} جنيه | صافي الربح: ${tr-te} جنيه</b></div><h2>الإيرادات</h2><table><tr><th>المصدر</th><th>المبلغ</th><th>التاريخ</th></tr>${rr}</table><h2>المصروفات</h2><table><tr><th>البند</th><th>المبلغ</th><th>التاريخ</th></tr>${er}</table><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
    });
  });
});

app.listen(PORT, () => console.log(`🚀 النظام يعمل على المنفذ ${PORT}`));
