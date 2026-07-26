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

// ======== Audit Log ========
function logAction(action, details) {
  db.run("INSERT INTO audit_log (action, details, created_at) VALUES (?, ?, ?)", [action, details, new Date().toISOString()]);
}

// ======== إنشاء الجداول ========
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, national_id TEXT, date_of_birth TEXT, gender TEXT, grade TEXT, section TEXT, status TEXT, photo TEXT, seat_number TEXT, medical_notes TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS parents (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, name TEXT, relation TEXT, phone TEXT, email TEXT, address TEXT, occupation TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, department TEXT, phone TEXT, email TEXT, salary REAL, hire_date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, subject_id INTEGER, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS fees (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, amount REAL, status TEXT, due_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, student_name TEXT, subject TEXT, score REAL, max_score REAL, exam_name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, subject TEXT, grade TEXT, date TEXT, max_score REAL, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT, period TEXT, subject TEXT, teacher TEXT, grade TEXT, section TEXT, room TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS school_info (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, logo TEXT, address TEXT, phone TEXT, email TEXT, academic_year TEXT, branches TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS terms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, start_date TEXT, end_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS grades_levels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, level INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY AUTOINCREMENT, grade_id INTEGER, name TEXT, capacity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, code TEXT, grade_id INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, type TEXT, capacity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS clinic_records (id INTEGER PRIMARY KEY AUTOINCREMENT, student_name TEXT, date TEXT, complaint TEXT, diagnosis TEXT, treatment TEXT, notes TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS transport (id INTEGER PRIMARY KEY AUTOINCREMENT, bus_number TEXT, driver_name TEXT, driver_phone TEXT, route TEXT, capacity INTEGER, students_count INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY AUTOINCREMENT, book_title TEXT, author TEXT, isbn TEXT, category TEXT, total_copies INTEGER, available_copies INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS library_borrow (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, student_name TEXT, borrow_date TEXT, return_date TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT, category TEXT, quantity INTEGER, unit_price REAL, location TEXT, last_updated TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_name TEXT, type TEXT, location TEXT, condition TEXT, purchase_date TEXT, value REAL, maintenance_date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS maintenance_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_name TEXT, description TEXT, priority TEXT, status TEXT, created_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS calendar_events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, event_date TEXT, event_type TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, details TEXT, created_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, type TEXT, target TEXT, sent_at TEXT, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, receiver TEXT, subject TEXT, body TEXT, created_at TEXT, is_read INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS salaries (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_name TEXT, role TEXT, month TEXT, basic_salary REAL, bonuses REAL, deductions REAL, net_salary REAL, status TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, category TEXT, amount REAL, date TEXT, approved_by TEXT, status TEXT)`);

  // ======== بيانات أولية ========
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hp = bcrypt.hashSync("admin123", 10);
      
      // المستخدمين
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('المدير العام', 'admin@school.com', '${hp}', 'admin')`);
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('الوكيل', 'deputy@school.com', '${hp}', 'deputy')`);
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('المحاسب', 'accountant@school.com', '${hp}', 'accountant')`);
      
      // الطلاب
      db.run(`INSERT INTO students (name, national_id, date_of_birth, gender, grade, section, status, seat_number) VALUES ('أحمد محمد', '30101011234567', '2010-05-15', 'ذكر', 'الصف الأول', 'أ', 'نشط', '001')`);
      db.run(`INSERT INTO students (name, national_id, date_of_birth, gender, grade, section, status, seat_number) VALUES ('سارة علي', '30102021234568', '2010-08-22', 'أنثى', 'الصف الثاني', 'ب', 'نشط', '002')`);
      db.run(`INSERT INTO students (name, national_id, date_of_birth, gender, grade, section, status, seat_number, medical_notes) VALUES ('يوسف خالد', '30103031234569', '2009-12-01', 'ذكر', 'الصف الثالث', 'ج', 'نشط', '003', 'حساسية من المكسرات')`);
      db.run(`INSERT INTO students (name, national_id, date_of_birth, gender, grade, section, status, seat_number) VALUES ('نور أحمد', '30104041234570', '2011-03-10', 'أنثى', 'الصف الأول', 'أ', 'نشط', '004')`);
      db.run(`INSERT INTO students (name, national_id, date_of_birth, gender, grade, section, status, seat_number) VALUES ('عمر حسن', '30105051234571', '2010-07-18', 'ذكر', 'الصف الثاني', 'أ', 'نشط', '005')`);
      
      // أولياء الأمور
      db.run(`INSERT INTO parents (student_id, name, relation, phone, email, address, occupation) VALUES (1, 'محمد أحمد', 'الأب', '01012345678', 'mohammed@email.com', 'القاهرة - المعادي', 'مهندس')`);
      db.run(`INSERT INTO parents (student_id, name, relation, phone, email, address, occupation) VALUES (2, 'علي حسن', 'الأب', '01098765432', 'ali@email.com', 'القاهرة - مدينة نصر', 'طبيب')`);
      db.run(`INSERT INTO parents (student_id, name, relation, phone, email, address, occupation) VALUES (3, 'خالد يوسف', 'الأب', '01112345678', 'khaled@email.com', 'الجيزة - الدقي', 'محاسب')`);
      
      // الموظفين
      db.run(`INSERT INTO employees (name, role, department, phone, email, salary, hire_date, status) VALUES ('فاطمة الزهراء', 'سكرتيرة', 'الإدارة', '01212345678', 'fatma@school.com', 4500, '2023-01-15', 'نشط')`);
      db.run(`INSERT INTO employees (name, role, department, phone, email, salary, hire_date, status) VALUES ('حسام الدين', 'أمن', 'الأمن', '01298765432', 'hossam@school.com', 3500, '2022-06-01', 'نشط')`);
      db.run(`INSERT INTO employees (name, role, department, phone, email, salary, hire_date, status) VALUES ('أمينة', 'عاملة نظافة', 'الصيانة', '01255555555', '', 3000, '2023-03-01', 'نشط')`);
      
      // المعلمون
      db.run(`INSERT INTO teachers (name, email, phone, subject_id, status) VALUES ('أ. محمد أحمد', 'math@school.com', '01011111111', 1, 'نشط')`);
      db.run(`INSERT INTO teachers (name, email, phone, subject_id, status) VALUES ('أ. فاطمة علي', 'science@school.com', '01022222222', 2, 'نشط')`);
      db.run(`INSERT INTO teachers (name, email, phone, subject_id, status) VALUES ('أ. خالد إبراهيم', 'arabic@school.com', '01033333333', 3, 'نشط')`);
      
      // الرسوم
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (1, 'أحمد محمد', 5000, 'unpaid', '2026-09-01')`);
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (2, 'سارة علي', 5000, 'paid', '2026-09-01')`);
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (3, 'يوسف خالد', 5500, 'unpaid', '2026-09-01')`);
      
      // الدرجات
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score, exam_name) VALUES (1, 'أحمد محمد', 'الرياضيات', 95, 100, 'امتحان منتصف الترم')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score, exam_name) VALUES (1, 'أحمد محمد', 'العلوم', 88, 100, 'امتحان منتصف الترم')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score, exam_name) VALUES (2, 'سارة علي', 'الرياضيات', 92, 100, 'امتحان منتصف الترم')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score, exam_name) VALUES (2, 'سارة علي', 'اللغة العربية', 85, 100, 'امتحان منتصف الترم')`);
      
      // الامتحانات
      db.run(`INSERT INTO exams (name, subject, grade, date, max_score, status) VALUES ('امتحان منتصف الترم', 'الرياضيات', 'الصف الأول', '2026-11-15', 100, 'مكتمل')`);
      db.run(`INSERT INTO exams (name, subject, grade, date, max_score, status) VALUES ('امتحان نهاية الترم', 'العلوم', 'الصف الأول', '2027-01-10', 100, 'قادم')`);
      
      // الحضور
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (1, 'أحمد محمد', '2026-07-26', 'present')`);
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (2, 'سارة علي', '2026-07-26', 'absent')`);
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (3, 'يوسف خالد', '2026-07-26', 'late')`);
      db.run(`INSERT INTO attendance (student_id, student_name, date, status) VALUES (4, 'نور أحمد', '2026-07-26', 'present')`);
      
      // الجدول المدرسي
      db.run(`INSERT INTO schedules (day, period, subject, teacher, grade, section, room) VALUES ('الأحد', 'الأولى', 'الرياضيات', 'أ. محمد أحمد', 'الصف الأول', 'أ', 'القاعة 101')`);
      db.run(`INSERT INTO schedules (day, period, subject, teacher, grade, section, room) VALUES ('الأحد', 'الثانية', 'العلوم', 'أ. فاطمة علي', 'الصف الأول', 'أ', 'معمل العلوم')`);
      db.run(`INSERT INTO schedules (day, period, subject, teacher, grade, section, room) VALUES ('الأحد', 'الثالثة', 'اللغة العربية', 'أ. خالد إبراهيم', 'الصف الأول', 'أ', 'القاعة 101')`);
      db.run(`INSERT INTO schedules (day, period, subject, teacher, grade, section, room) VALUES ('الاثنين', 'الأولى', 'اللغة الإنجليزية', 'أ. سارة', 'الصف الأول', 'أ', 'القاعة 102')`);
      db.run(`INSERT INTO schedules (day, period, subject, teacher, grade, section, room) VALUES ('الاثنين', 'الثانية', 'الرياضيات', 'أ. محمد أحمد', 'الصف الثاني', 'ب', 'القاعة 103')`);
      
      // بيانات المدرسة
      db.run(`INSERT INTO school_info (name, logo, address, phone, email, academic_year, branches) VALUES ('مدرسة النور الخاصة', '🏫', 'القاهرة - المعادي - شارع 9', '01234567890', 'info@alnoor.edu', '2026-2027', 'الفرع الرئيسي، فرع أكتوبر')`);
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الأول', '2026-09-01', '2027-01-15')`);
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الثاني', '2027-02-01', '2027-06-15')`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الأول', 1)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثاني', 2)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثالث', 3)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'أ', 30)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'ب', 30)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (2, 'أ', 28)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('الرياضيات', 'MATH101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('العلوم', 'SCI101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('اللغة العربية', 'ARA101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('اللغة الإنجليزية', 'ENG101', 1)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('القاعة 101', 'قاعة', 30)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('القاعة 102', 'قاعة', 30)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('معمل الحاسوب', 'معمل', 25)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('معمل العلوم', 'معمل', 25)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('المكتبة', 'مكتبة', 50)`);
      
      // العيادة
      db.run(`INSERT INTO clinic_records (student_name, date, complaint, diagnosis, treatment, notes) VALUES ('يوسف خالد', '2026-07-20', 'صداع', 'صداع توتري', 'باراسيتامول', 'يراجع بعد يومين')`);
      
      // النقل
      db.run(`INSERT INTO transport (bus_number, driver_name, driver_phone, route, capacity, students_count) VALUES ('BUS-01', 'عم سعيد', '01011111111', 'المعادي → المدرسة', 25, 20)`);
      db.run(`INSERT INTO transport (bus_number, driver_name, driver_phone, route, capacity, students_count) VALUES ('BUS-02', 'عم حسن', '01022222222', 'مدينة نصر → المدرسة', 30, 25)`);
      
      // المكتبة
      db.run(`INSERT INTO library (book_title, author, isbn, category, total_copies, available_copies) VALUES ('الرياضيات للصف الأول', 'د. أحمد', '978-1-234', 'دراسي', 10, 7)`);
      db.run(`INSERT INTO library (book_title, author, isbn, category, total_copies, available_copies) VALUES ('قصص عربية', 'أ. فاطمة', '978-5-678', 'ثقافي', 5, 4)`);
      
      // المخازن
      db.run(`INSERT INTO inventory (item_name, category, quantity, unit_price, location, last_updated) VALUES ('دفتر 80 ورقة', 'قرطاسية', 200, 5, 'المخزن الرئيسي', '2026-07-01')`);
      db.run(`INSERT INTO inventory (item_name, category, quantity, unit_price, location, last_updated) VALUES ('سبورة بيضاء', 'أثاث', 15, 350, 'المخزن الرئيسي', '2026-06-15')`);
      
      // الأصول
      db.run(`INSERT INTO assets (asset_name, type, location, condition, purchase_date, value, maintenance_date) VALUES ('كمبيوتر المكتبة', 'إلكتروني', 'المكتبة', 'جيد', '2025-01-15', 8000, '2026-07-15')`);
      db.run(`INSERT INTO assets (asset_name, type, location, condition, purchase_date, value, maintenance_date) VALUES ('ماكينة تصوير', 'إلكتروني', 'الإدارة', 'يحتاج صيانة', '2023-05-20', 12000, '2026-01-10')`);
      
      // التقويم
      db.run(`INSERT INTO calendar_events (title, description, event_date, event_type, status) VALUES ('بداية العام الدراسي', 'استقبال الطلاب الجدد', '2026-09-01', 'أكاديمي', 'قادم')`);
      db.run(`INSERT INTO calendar_events (title, description, event_date, event_type, status) VALUES ('امتحان منتصف الترم', 'جميع المواد', '2026-11-15', 'امتحان', 'قادم')`);
      db.run(`INSERT INTO calendar_events (title, description, event_date, event_type, status) VALUES ('رحلة مدرسية', 'زيارة المتحف المصري', '2026-10-20', 'نشاط', 'قادم')`);
      
      // الرواتب
      db.run(`INSERT INTO salaries (employee_name, role, month, basic_salary, bonuses, deductions, net_salary, status) VALUES ('أ. محمد أحمد', 'معلم', 'يوليو 2026', 6000, 500, 300, 6200, 'مدفوع')`);
      db.run(`INSERT INTO salaries (employee_name, role, month, basic_salary, bonuses, deductions, net_salary, status) VALUES ('فاطمة الزهراء', 'سكرتيرة', 'يوليو 2026', 4500, 0, 200, 4300, 'مدفوع')`);
      
      // المصروفات
      db.run(`INSERT INTO expenses (description, category, amount, date, approved_by, status) VALUES ('فاتورة كهرباء', 'مرافق', 3500, '2026-07-01', 'المدير العام', 'معتمد')`);
      db.run(`INSERT INTO expenses (description, category, amount, date, approved_by, status) VALUES ('شراء أوراق طباعة', 'قرطاسية', 800, '2026-07-10', 'الوكيل', 'معتمد')`);
      
      console.log("✅ تم إنشاء قاعدة البيانات الشاملة!");
      logAction('SYSTEM_INIT', 'تم إنشاء قاعدة البيانات والبيانات الأولية');
    }
  });
});

// ======== الصفحات ========
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// ======== APIs الأساسية ========
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: "بيانات غير صحيحة" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    logAction('LOGIN', `${user.name} (${user.role})`);
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

// الطلاب
app.get('/api/students', (req, res) => db.all("SELECT * FROM students", (e, r) => res.json({ success: true, count: r.length, data: r })));
app.post('/api/students', (req, res) => {
  const { name, grade, section, national_id, gender, date_of_birth, seat_number, medical_notes } = req.body;
  db.run("INSERT INTO students (name, grade, section, national_id, gender, date_of_birth, seat_number, medical_notes, status) VALUES (?,?,?,?,?,?,?,?,?)", [name, grade, section, national_id||'', gender||'', date_of_birth||'', seat_number||'', medical_notes||'', 'نشط'], function(e) {
    if(e) return res.status(500).json({success:false, message:e.message});
    logAction('ADD_STUDENT', name);
    res.json({ success: true, id: this.lastID });
  });
});

// أولياء الأمور
app.get('/api/parents', (req, res) => db.all("SELECT * FROM parents", (e, r) => res.json({ success: true, data: r })));

// الموظفين
app.get('/api/employees', (req, res) => db.all("SELECT * FROM employees", (e, r) => res.json({ success: true, data: r })));

// المعلمين
app.get('/api/teachers', (req, res) => db.all("SELECT t.*, s.name as subject_name FROM teachers t LEFT JOIN subjects s ON t.subject_id = s.id", (e, r) => res.json({ success: true, data: r })));

// المواد
app.get('/api/subjects', (req, res) => db.all("SELECT * FROM subjects", (e, r) => res.json({ success: true, data: r })));

// الحضور
app.get('/api/attendance', (req, res) => db.all("SELECT * FROM attendance", (e, r) => res.json({ success: true, data: r })));
app.post('/api/attendance', (req, res) => {
  const { student_id, student_name, date, status } = req.body;
  db.run("INSERT INTO attendance (student_id, student_name, date, status) VALUES (?,?,?,?)", [student_id, student_name, date, status], function(e) {
    logAction('ATTENDANCE', `${student_name}: ${status}`);
    if (status === 'absent') {
      db.run("INSERT INTO notifications (title, message, type, target, sent_at, status) VALUES (?, ?, ?, ?, ?, ?)", [`غياب ${student_name}`, `الطالب ${student_name} غائب اليوم`, 'whatsapp', 'ولي الأمر', new Date().toISOString(), 'تم الإرسال']);
    }
    res.json({ success: true, id: this.lastID });
  });
});

// الرسوم
app.get('/api/fees', (req, res) => db.all("SELECT * FROM fees", (e, r) => res.json({ success: true, data: r })));

// الدرجات
app.get('/api/grades', (req, res) => db.all("SELECT * FROM grades", (e, r) => res.json({ success: true, data: r })));

// الامتحانات
app.get('/api/exams', (req, res) => db.all("SELECT * FROM exams", (e, r) => res.json({ success: true, data: r })));

// الجدول المدرسي
app.get('/api/schedules', (req, res) => db.all("SELECT * FROM schedules ORDER BY CASE day WHEN 'الأحد' THEN 1 WHEN 'الاثنين' THEN 2 WHEN 'الثلاثاء' THEN 3 WHEN 'الأربعاء' THEN 4 WHEN 'الخميس' THEN 5 END", (e, r) => res.json({ success: true, data: r })));

// المدرسة
app.get('/api/school', (req, res) => db.get("SELECT * FROM school_info", (e, r) => res.json({ success: true, data: r })));
app.get('/api/terms', (req, res) => db.all("SELECT * FROM terms", (e, r) => res.json({ success: true, data: r })));
app.get('/api/sections', (req, res) => db.all("SELECT s.*, g.name as grade_name FROM sections s JOIN grades_levels g ON s.grade_id = g.id", (e, r) => res.json({ success: true, data: r })));
app.get('/api/rooms', (req, res) => db.all("SELECT * FROM rooms", (e, r) => res.json({ success: true, data: r })));

// العيادة
app.get('/api/clinic', (req, res) => db.all("SELECT * FROM clinic_records ORDER BY date DESC", (e, r) => res.json({ success: true, data: r })));

// النقل
app.get('/api/transport', (req, res) => db.all("SELECT * FROM transport", (e, r) => res.json({ success: true, data: r })));

// المكتبة
app.get('/api/library', (req, res) => db.all("SELECT * FROM library", (e, r) => res.json({ success: true, data: r })));

// المخازن
app.get('/api/inventory', (req, res) => db.all("SELECT * FROM inventory", (e, r) => res.json({ success: true, data: r })));

// الأصول
app.get('/api/assets', (req, res) => db.all("SELECT * FROM assets", (e, r) => res.json({ success: true, data: r })));
app.get('/api/maintenance', (req, res) => db.all("SELECT * FROM maintenance_requests ORDER BY created_at DESC", (e, r) => res.json({ success: true, data: r })));

// التقويم
app.get('/api/calendar', (req, res) => db.all("SELECT * FROM calendar_events ORDER BY event_date", (e, r) => res.json({ success: true, data: r })));

// سجل النشاط
app.get('/api/audit', (req, res) => db.all("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100", (e, r) => res.json({ success: true, data: r })));

// الإشعارات
app.get('/api/notifications', (req, res) => db.all("SELECT * FROM notifications ORDER BY sent_at DESC", (e, r) => res.json({ success: true, data: r })));

// المراسلات
app.get('/api/messages', (req, res) => db.all("SELECT * FROM messages ORDER BY created_at DESC", (e, r) => res.json({ success: true, data: r })));

// الرواتب
app.get('/api/salaries', (req, res) => db.all("SELECT * FROM salaries", (e, r) => res.json({ success: true, data: r })));

// المصروفات
app.get('/api/expenses', (req, res) => db.all("SELECT * FROM expenses ORDER BY date DESC", (e, r) => res.json({ success: true, data: r })));

// ======== الشهادات ========
app.get('/certificate/:id', (req, res) => {
  db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (err, student) => {
    if (err || !student) return res.status(404).send("الطالب غير موجود");
    db.all("SELECT * FROM grades WHERE student_id = ?", [req.params.id], (err, grades) => {
      let ts=0, tm=0;
      grades.forEach(g => { ts+=g.score; tm+=g.max_score; });
      const p = tm>0?((ts/tm)*100).toFixed(2):0;
      const g = p>=90?'ممتاز':p>=80?'جيد جداً':p>=70?'جيد':p>=60?'مقبول':'ضعيف';
      res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>شهادة - ${student.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');body{font-family:'Amiri',serif;background:linear-gradient(135deg,#667eea,#764ba2);margin:0;padding:40px 20px}.cert{max-width:800px;margin:auto;background:white;padding:60px 40px;border:15px double #d4af37;border-radius:10px}.header{text-align:center;border-bottom:3px double #d4af37;padding-bottom:20px;margin-bottom:30px}.title{text-align:center;font-size:36px;color:#d4af37;margin:30px 0}.name{text-align:center;font-size:32px;color:#1e40af;border-bottom:2px solid #d4af37;display:inline-block;padding:0 40px 10px}table{width:100%;border-collapse:collapse;margin:30px 0}th{background:#1e40af;color:white;padding:12px}td{padding:12px;border:1px solid #ddd;text-align:center}.sum{background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0;text-align:center}.pct{font-size:48px;color:#1e40af;font-weight:bold}.print-btn{display:block;margin:20px auto;padding:15px 40px;background:#1e40af;color:white;border:none;border-radius:5px;font-size:18px;cursor:pointer}@media print{body{background:white;padding:0}.print-btn{display:none}}</style></head><body><div class="cert"><div class="header"><h1>🏫 مدرسة النور الخاصة</h1></div><div class="title">شهادة تقدير</div><div style="text-align:center"><p style="font-size:20px">تشهد المدرسة بأن الطالب</p><div class="name">${student.name}</div><p>الصف ${student.grade} - شعبة ${student.section} - رقم الجلوس ${student.seat_number||'-'}</p></div><table><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr>${grades.map(g=>`<tr><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${((g.score/g.max_score)*100).toFixed(1)}%</td></tr>`).join('')}</table><div class="sum"><div>المجموع: ${ts}/${tm}</div><div class="pct">${p}%</div><div style="font-size:32px;color:#d4af37">التقدير: ${g}</div></div></div><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
    });
  });
});

// ======== التقارير ========
function generateReport(title, headers, rows, rowFn) {
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:40px}h1{text-align:center;color:#1e40af}p{text-align:center;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px;text-align:center}td{padding:10px;border:1px solid #ddd;text-align:center}tr:nth-child(even){background:#f9fafb}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px}@media print{.print-btn{display:none}}</style></head><body><h1>${title}</h1><p>تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p><table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(rowFn).join('')}</table><button class="print-btn" onclick="window.print()">🖨️ طباعة التقرير</button></body></html>`;
}

app.get('/api/reports/students', (req, res) => {
  db.all("SELECT * FROM students", (e, rows) => res.send(generateReport('📄 تقرير الطلاب', ['#','الاسم','الصف','الشعبة','رقم الجلوس','الحالة'], rows, s=>`<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.seat_number||'-'}</td><td>${s.status}</td></tr>`)));
});

app.get('/api/reports/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (e, rows) => res.send(generateReport('📅 تقرير الحضور', ['#','الطالب','التاريخ','الحالة'], rows, a=>`<tr style="background:${a.status==='present'?'#d1fae5':a.status==='absent'?'#fee2e2':'#fef3c7'}"><td>${a.id}</td><td>${a.student_name}</td><td>${a.date}</td><td>${a.status==='present'?'حاضر':a.status==='absent'?'غائب':'متأخر'}</td></tr>`)));
});

app.get('/api/reports/fees', (req, res) => {
  db.all("SELECT * FROM fees", (e, rows) => {
    let total=0,paid=0; rows.forEach(f=>{total+=f.amount;if(f.status==='paid')paid+=f.amount;});
    res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}.box{background:#f0f9ff;padding:20px;border-radius:10px;margin:20px 0;text-align:center}.print-btn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body><h1>💰 التقرير المالي</h1><p style="text-align:center">${new Date().toLocaleDateString('ar-EG')}</p><div class="box"><h2>الإجمالي: ${total} جنيه | المدفوع: ${paid} جنيه | المتبقي: ${total-paid} جنيه</h2></div><table><tr><th>#</th><th>الطالب</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th></tr>${rows.map(f=>`<tr><td>${f.id}</td><td>${f.student_name}</td><td>${f.amount}</td><td>${f.due_date}</td><td>${f.status==='paid'?'مدفوع':'غير مدفوع'}</td></tr>`).join('')}</table><button class="print-btn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
  });
});

app.get('/api/reports/grades', (req, res) => {
  db.all("SELECT * FROM grades", (e, rows) => res.send(generateReport('🎯 تقرير الدرجات', ['الطالب','المادة','الدرجة','من','النسبة','التقدير'], rows, g=>{const p=((g.score/g.max_score)*100).toFixed(1);const gr=p>=90?'ممتاز':p>=80?'جيد جداً':p>=70?'جيد':p>=60?'مقبول':'ضعيف';return `<tr><td>${g.student_name}</td><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${p}%</td><td>${gr}</td></tr>`;})));
});

// ======== تشغيل الخادم ========
app.listen(PORT, () => {
  console.log(`🚀 النظام الشامل يعمل على المنفذ ${PORT}`);
});
