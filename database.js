const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./school.db');

db.serialize(() => {
  // 1. جدول المستخدمين (مع تشفير كلمة المرور)
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

  // إضافة بيانات أولية إذا كانت القاعدة فارغة
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(`INSERT INTO users (name, email, password, role) VALUES ('المدير العام', 'admin@school.com', '${hashedPassword}', 'admin')`);
      
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('أحمد محمد', 'الصف الأول', 'أ', 'نشط')`);
      db.run(`INSERT INTO students (name, grade, section, status) VALUES ('سارة علي', 'الصف الثاني', 'ب', 'نشط')`);
      
      db.run(`INSERT INTO fees (student_id, student_name, amount, status, due_date) VALUES (1, 'أحمد محمد', 5000, 'unpaid', '2026-09-01')`);
      db.run(`INSERT INTO grades (student_id, student_name, subject, score, max_score) VALUES (1, 'أحمد محمد', 'الرياضيات', 95, 100)`);
      
      console.log("✅ تم إنشاء قاعدة البيانات والبيانات الأولية بنجاح!");
    }
  });
});

module.exports = db;
