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
db.run(`CREATE TABLE IF NOT EXISTS grades (
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
db.get("SELECT COUNT(*) as count FROM school_info", (err, row) => {
  if (row.count === 0) {
    db.run(`INSERT INTO school_info (name, logo, address, phone, email, academic_year, branches) 
            VALUES ('مدرسة النور الخاصة', '🏫', 'القاهرة، مصر', '01234567890', 'info@alnoor.edu', '2026-2027', 'الفرع الرئيسي')`);
    
    db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الأول', '2026-09-01', '2027-01-15')`);
    db.run(`INSERT INTO terms (name, start_date, end_date) VALUES ('الفصل الدراسي الثاني', '2027-02-01', '2027-06-15')`);
    
    db.run(`INSERT INTO grades (name, level) VALUES ('الصف الأول', 1)`);
    db.run(`INSERT INTO grades (name, level) VALUES ('الصف الثاني', 2)`);
    db.run(`INSERT INTO grades (name, level) VALUES ('الصف الثالث', 3)`);
    
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
    
    console.log("✅ تم إضافة بيانات المدرسة الأولية!");
  }
});
