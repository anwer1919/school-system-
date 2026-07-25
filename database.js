const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./school.db');

db.serialize(() => {
  // 1. جدول المستخدمين
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  // 2. جدول الطلاب
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    grade TEXT,
    section TEXT,
    status TEXT
  )`);

  // 3. جدول الحضور
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT,
    date TEXT,
    status TEXT
  )`);

  // 4. جدول الرسوم المالية
  db.run(`CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT,
    amount REAL,
    status TEXT,
    due_date TEXT
  )`);

  // 5. جدول الدرجات
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT,
    subject TEXT,
    score REAL,
    max_score REAL
  )`);

  // 6. جدول بيانات المدرسة
  db.run(`CREATE TABLE IF NOT EXISTS school_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    academic_year TEXT,
    branches TEXT
  )`);

  // 7. جدول الفصول الدراسية
  db.run(`CREATE TABLE IF NOT EXISTS terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    start_date TEXT,
    end_date TEXT
  )`);

  // 8. جدول الصفوف
  db.run(`CREATE TABLE IF NOT EXISTS grades_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    level INTEGER
  )`);

  // 9. جدول الشعب
  db.run(`CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_id INTEGER,
    name TEXT,
    capacity INTEGER
  )`);

  // 10. جدول المواد الدراسية
  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT,
    grade_id INTEGER
  )`);

  // 11. جدول المعلمون
  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    subject_id INTEGER
  )`);

  // 12. جدول القاعات والمعامل
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    capacity INTEGER
  )`);

  // إضافة بيانات أولية
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('المدير العام', 'admin@school.com', '${hashedPassword}', 'admin')`);
      
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('أحمد محمد', 'الصف الأول', 'أ', 'نشط')`);
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('سارة علي', 'الصف الثاني', 'ب', 'نشط')`);
      
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (1, 'أحمد محمد', 5000, 'unpaid', '2026-09-01')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score) VALUES (1, 'أحمد محمد', 'الرياضيات', 95, 100)`);
      
      // بيانات المدرسة
      db.run(`INSERT INTO school_info (name, logo, address, phone, email, academic_year, branches) 
              VALUES ('مدرسة النور الخاصة', '🏫', 'القاهرة، مصر', '01234567890', 'info@alnoor.edu', '2026-2027', 'الفرع الرئيسي')`);
      
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الأول', '2026-09-01', '2027-01-15')`);
      db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الثاني', '2027-02-01', '2027-06-15')`);
      
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الأول', 1)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثاني', 2)`);
      db.run(`INSERT INTO grades_levels (name, level) VALUES ('الصف الثالث', 3)`);
      
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'أ', 30)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (1, 'ب', 30)`);
      db.run(`INSERT INTO sections (grade_id, name, capacity) VALUES (2, 'أ', 30)`);
      
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('الرياضيات', 'MATH101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('العلوم', 'SCI101', 1)`);
      db.run(`INSERT INTO subjects (name, code, grade_id) VALUES ('اللغة العربية', 'ARA101', 1)`);
      
      db.run(`INSERT INTO teachers (name, email, phone, subject_id) VALUES ('أ. محمد أحمد', 'teacher@school.com', '01012345678', 1)`);
      db.run(`INSERT INTO teachers (name, email, phone, subject_id) VALUES ('أ. فاطمة علي', 'fatima@school.com', '01098765432', 2)`);
      
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('القاعة 101', 'classroom', 30)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('معمل الحاسوب', 'lab', 25)`);
      db.run(`INSERT INTO rooms (name, type, capacity) VALUES ('المكتبة', 'library', 50)`);
      
      console.log("✅ تم إنشاء قاعدة البيانات والبيانات الأولية بنجاح!");
    }
  });
});

module.exports = db;
