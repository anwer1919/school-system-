const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./school.db');

// ======== إنشاء الجداول ========
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

  // بيانات أولية
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hp = bcrypt.hashSync("admin123", 10);
      db.run(`INSERT INTO users (name,email,password,role,phone) VALUES ('المدير العام','admin@school.com','${hp}','مدير','01000000001')`);
      db.run(`INSERT INTO school_info (name,logo,address,phone,email,academic_year,branches) VALUES ('مدرسة النور الخاصة','🏫','القاهرة، مصر','01234567890','info@alnoor.edu','2026-2027','الفرع الرئيسي')`);
      db.run(`INSERT INTO students (name,grade,section,status,seat_number,birth_date,gender) VALUES ('أحمد محمد','الصف الأول','أ','نشط','A1','2015-03-15','ذكر'),('سارة علي','الصف الثاني','أ','نشط','B3','2014-07-20','أنثى')`);
      db.run(`INSERT INTO teachers (name,email,phone,subject_id,salary) VALUES ('أ. محمد أحمد','mohamed@school.com','01011111111',1,8000),('أ. فاطمة علي','fatima@school.com','01022222222',2,7500)`);
      db.run(`INSERT INTO subjects (name,code,grade_id) VALUES ('الرياضيات','MATH',1),('العلوم','SCI',1),('اللغة العربية','ARA',1)`);
      db.run(`INSERT INTO settings (key,value) VALUES ('school_name','مدرسة النور'),('whatsapp_enabled','false')`);
      console.log("✅ تم إنشاء قاعدة البيانات!");
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

// ======== تسجيل الدخول ========
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: "بيانات غير صحيحة" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    logAction(user.name, 'تسجيل دخول', 'دخول ناجح');
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

// ======== APIs عامة: GET لكل الجداول ========
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

// ======== APIs: إضافة (POST) ========
const createRoutes = {
  students: { sql: "INSERT INTO students (name,grade,section,status,parent_id,seat_number,birth_date,gender) VALUES (?,?,?,?,?,?,?,?)", fields: ['name','grade','section','status','parent_id','seat_number','birth_date','gender'], action: 'إضافة طالب' },
  teachers: { sql: "INSERT INTO teachers (name,email,phone,subject_id,salary) VALUES (?,?,?,?,?)", fields: ['name','email','phone','subject_id','salary'], action: 'إضافة معلم' },
  employees: { sql: "INSERT INTO employees (name,email,phone,role,salary) VALUES (?,?,?,?,?)", fields: ['name','email','phone','role','salary'], action: 'إضافة موظف' },
  parents: { sql: "INSERT INTO parents (name,email,phone,address,job) VALUES (?,?,?,?,?)", fields: ['name','email','phone','address','job'], action: 'إضافة ولي أمر' },
  subjects: { sql: "INSERT INTO subjects (name,code,grade_id) VALUES (?,?,?)", fields: ['name','code','grade_id'], action: 'إضافة مادة' },
  exams: { sql: "INSERT INTO exams (name,subject,grade,date,max_score,status) VALUES (?,?,?,?,?,?)", fields: ['name','subject','grade','date','max_score','status'], action: 'إضافة امتحان' },
  fees: { sql: "INSERT INTO fees (student_id,student_name,amount,status,due_date,type) VALUES (?,?,?,?,?,?)", fields: ['student_id','student_name','amount','status','due_date','type'], action: 'إضافة رسم' },
  attendance: { sql: "INSERT INTO attendance (student_id,student_name,date,status) VALUES (?,?,?,?)", fields: ['student_id','student_name','date','status'], action: 'تسجيل حضور' },
  grades: { sql: "INSERT INTO grades (student_id,student_name,subject,score,max_score,exam_type) VALUES (?,?,?,?,?,?)", fields: ['student_id','student_name','subject','score','max_score','exam_type'], action: 'رصد درجة' },
  schedules: { sql: "INSERT INTO schedules (day,period,subject,teacher,section,room) VALUES (?,?,?,?,?,?)", fields: ['day','period','subject','teacher','section','room'], action: 'إضافة حصة' },
  revenue: { sql: "INSERT INTO revenue (source,amount,date,notes) VALUES (?,?,?,?)", fields: ['source','amount','date','notes'], action: 'إضافة إيراد' },
  expenses: { sql: "INSERT INTO expenses (category,amount,date,notes) VALUES (?,?,?,?)", fields: ['category','amount','date','notes'], action: 'إضافة مصروف' },
  clinic: { sql: "INSERT INTO clinic (student_name,date,complaint,treatment) VALUES (?,?,?,?)", fields: ['student_name','date','complaint','treatment'], action: 'سجل عيادة' },
  transport: { sql: "INSERT INTO transport (bus_name,route,driver,capacity,students_count) VALUES (?,?,?,?,?)", fields: ['bus_name','route','driver','capacity','students_count'], action: 'إضافة باص' },
  library: { sql: "INSERT INTO library (book_title,author,isbn,status,borrower,due_date) VALUES (?,?,?,?,?,?)", fields: ['book_title','author','isbn','status','borrower','due_date'], action: 'إضافة كتاب' },
  inventory: { sql: "INSERT INTO inventory (item_name,category,quantity,location) VALUES (?,?,?,?)", fields: ['item_name','category','quantity','location'], action: 'إضافة صنف' },
  calendar_events: { sql: "INSERT INTO calendar_events (title,date,type,description) VALUES (?,?,?,?)", fields: ['title','date','type','description'], action: 'إضافة حدث' }
};

Object.keys(createRoutes).forEach(table => {
  app.post(`/api/${table}`, (req, res) => {
    const config = createRoutes[table];
    const values = config.fields.map(f => req.body[f] || null);
    db.run(config.sql, values, function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      logAction('المستخدم', config.action, JSON.stringify(req.body));
      res.json({ success: true, id: this.lastID, message: 'تمت الإضافة بنجاح ✅' });
    });
  });
});

// ======== APIs: تعديل (PUT) ========
const updateRoutes = {
  students: { sql: "UPDATE students SET name=?,grade=?,section=?,status=?,seat_number=?,birth_date=?,gender=? WHERE id=?", fields: ['name','grade','section','status','seat_number','birth_date','gender'] },
  teachers: { sql: "UPDATE teachers SET name=?,email=?,phone=?,subject_id=?,salary=? WHERE id=?", fields: ['name','email','phone','subject_id','salary'] },
  employees: { sql: "UPDATE employees SET name=?,email=?,phone=?,role=?,salary=? WHERE id=?", fields: ['name','email','phone','role','salary'] },
  parents: { sql: "UPDATE parents SET name=?,email=?,phone=?,address=?,job=? WHERE id=?", fields: ['name','email','phone','address','job'] },
  subjects: { sql: "UPDATE subjects SET name=?,code=?,grade_id=? WHERE id=?", fields: ['name','code','grade_id'] },
  exams: { sql: "UPDATE exams SET name=?,subject=?,grade=?,date=?,max_score=?,status=? WHERE id=?", fields: ['name','subject','grade','date','max_score','status'] },
  fees: { sql: "UPDATE fees SET student_name=?,amount=?,status=?,due_date=?,type=? WHERE id=?", fields: ['student_name','amount','status','due_date','type'] },
  attendance: { sql: "UPDATE attendance SET student_name=?,date=?,status=? WHERE id=?", fields: ['student_name','date','status'] },
  grades: { sql: "UPDATE grades SET student_name=?,subject=?,score=?,max_score=?,exam_type=? WHERE id=?", fields: ['student_name','subject','score','max_score','exam_type'] },
  schedules: { sql: "UPDATE schedules SET day=?,period=?,subject=?,teacher=?,section=?,room=? WHERE id=?", fields: ['day','period','subject','teacher','section','room'] },
  revenue: { sql: "UPDATE revenue SET source=?,amount=?,date=?,notes=? WHERE id=?", fields: ['source','amount','date','notes'] },
  expenses: { sql: "UPDATE expenses SET category=?,amount=?,date=?,notes=? WHERE id=?", fields: ['category','amount','date','notes'] },
  clinic: { sql: "UPDATE clinic SET student_name=?,date=?,complaint=?,treatment=? WHERE id=?", fields: ['student_name','date','complaint','treatment'] },
  transport: { sql: "UPDATE transport SET bus_name=?,route=?,driver=?,capacity=?,students_count=? WHERE id=?", fields: ['bus_name','route','driver','capacity','students_count'] },
  library: { sql: "UPDATE library SET book_title=?,author=?,isbn=?,status=?,borrower=?,due_date=? WHERE id=?", fields: ['book_title','author','isbn','status','borrower','due_date'] },
  inventory: { sql: "UPDATE inventory SET item_name=?,category=?,quantity=?,location=? WHERE id=?", fields: ['item_name','category','quantity','location'] },
  calendar_events: { sql: "UPDATE calendar_events SET title=?,date=?,type=?,description=? WHERE id=?", fields: ['title','date','type','description'] }
};

Object.keys(updateRoutes).forEach(table => {
  app.put(`/api/${table}/:id`, (req, res) => {
    const config = updateRoutes[table];
    const values = config.fields.map(f => req.body[f] || null);
    values.push(req.params.id);
    db.run(config.sql, values, function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      logAction('المستخدم', 'تعديل', `${table} #${req.params.id}`);
      res.json({ success: true, message: 'تم التعديل بنجاح ✅' });
    });
  });
});

// ======== APIs: حذف (DELETE) ========
Object.keys(updateRoutes).forEach(table => {
  app.delete(`/api/${table}/:id`, (req, res) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      logAction('المستخدم', 'حذف', `${table} #${req.params.id}`);
      res.json({ success: true, message: 'تم الحذف بنجاح 🗑️' });
    });
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
      res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>شهادة - ${student.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');body{font-family:'Amiri',serif;background:linear-gradient(135deg,#667eea,#764ba2);margin:0;padding:40px 20px}.cert{max-width:800px;margin:auto;background:white;padding:60px 40px;border:15px double #d4af37;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.3)}.hdr{text-align:center;border-bottom:3px double #d4af37;padding-bottom:20px;margin-bottom:30px}.hdr h1{color:#1e40af;font-size:42px;margin:0}.ttl{text-align:center;font-size:36px;color:#d4af37;margin:30px 0;font-weight:bold}.sn{text-align:center;font-size:32px;color:#1e40af;margin:20px 0;border-bottom:2px solid #d4af37;display:inline-block;padding:0 40px 10px}table{width:100%;border-collapse:collapse;margin:30px 0}th{background:#1e40af;color:white;padding:12px}td{padding:12px;border:1px solid #ddd;text-align:center}.sum{background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0;text-align:center;font-size:20px}.pct{font-size:48px;color:#1e40af;font-weight:bold}.grd{font-size:32px;color:#d4af37;font-weight:bold}.pbtn{display:block;margin:20px auto;padding:15px 40px;background:#1e40af;color:white;border:none;border-radius:5px;font-size:18px;cursor:pointer}@media print{body{background:white;padding:0}.pbtn{display:none}}</style></head><body><div class="cert"><div class="hdr"><h1>🏫 مدرسة النور الخاصة</h1></div><div class="ttl">شهادة تقدير</div><div style="text-align:center"><p style="font-size:20px">تشهد المدرسة بأن الطالب</p><div class="sn">${student.name}</div><p style="font-size:20px">الصف ${student.grade} - شعبة ${student.section}</p></div><table><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr>${grades.map(g=>`<tr><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${((g.score/g.max_score)*100).toFixed(1)}%</td></tr>`).join('')}</table><div class="sum"><div>المجموع</div><div class="pct">${ts}/${tm}</div><div>النسبة: ${p}%</div><div class="grd">التقدير: ${g}</div></div></div><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
    });
  });
});

// ======== التقارير ========
function makeReport(title, headers, rows, extra = '') {
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border:1px solid #ddd;text-align:center}.pbtn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px}@media print{.pbtn{display:none}}</style></head><body><h1>${title}</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>${extra}<table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rows}</table><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
}

app.get('/api/reports/students', (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => {
    const r = rows.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.seat_number||'-'}</td><td>${s.status}</td></tr>`).join('');
    res.send(makeReport('📄 تقرير الطلاب', ['الرقم','الاسم','الصف','الشعبة','رقم الجلوس','الحالة'], r));
  });
});

app.get('/api/reports/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (err, rows) => {
    const r = rows.map(a => `<tr><td>${a.student_name}</td><td>${a.date}</td><td>${a.status==='present'?'حاضر':a.status==='absent'?'غائب':'متأخر'}</td></tr>`).join('');
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
    const r = rows.map(g => { const p=((g.score/g.max_score)*100).toFixed(1); const gr=p>=90?'ممتاز':p>=70?'جيد':'مقبول'; return `<tr><td>${g.student_name}</td><td>${g.subject}</td><td>${g.score}/${g.max_score}</td><td>${p}%</td><td>${gr}</td></tr>`; }).join('');
    res.send(makeReport('🎯 كشوف الدرجات', ['الطالب','المادة','الدرجة','النسبة','التقدير'], r));
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
      res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}h2{color:#1e40af;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border:1px solid #ddd;text-align:center}.sum{background:#f0f9ff;padding:15px;border-radius:10px;text-align:center;margin:20px 0}.pbtn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.pbtn{display:none}}</style></head><body><h1>💰 التقرير المالي</h1><div class="sum"><b>الإيرادات: ${tr} | المصروفات: ${te} | الصافي: ${tr-te}</b></div><h2>الإيرادات</h2><table><tr><th>المصدر</th><th>المبلغ</th><th>التاريخ</th></tr>${rr}</table><h2>المصروفات</h2><table><tr><th>البند</th><th>المبلغ</th><th>التاريخ</th></tr>${er}</table><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
    });
  });
});

app.listen(PORT, () => console.log(`🚀 النظام يعمل على المنفذ ${PORT}`));
