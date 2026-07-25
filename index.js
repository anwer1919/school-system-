const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { getStudentCertificate, generateCertificateHTML } = require('./certificate');

const app = express();
const PORT = process.env.PORT || 3004;

// ======== إعدادات النظام ========
app.use(cors());
app.use(express.json());
app.use(express.static('public'));  // <-- هذا السطر الجديد لعرض الواجهة

// ======== الصفحة الرئيسية (الواجهة الاحترافية) ========
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ======== واجهات برمجة التطبيقات (APIs) ========

// 1. تسجيل الدخول
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
    
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });

    res.json({ success: true, message: `مرحباً ${user.name}`, user: { id: user.id, name: user.name, role: user.role } });
  });
});

// 2. جلب الطلاب
app.get('/api/students', (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => {
    res.json({ success: true, count: rows.length, data: rows });
  });
});

// 3. إضافة طالب جديد
app.post('/api/students', (req, res) => {
  const { name, grade, section } = req.body;
  db.run("INSERT INTO students (name, grade, section, status) VALUES (?, ?, ?, 'نشط')", [name, grade, section], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "تم إضافة الطالب بنجاح", id: this.lastID });
  });
});

// 4. جلب الرسوم المالية
app.get('/api/fees', (req, res) => {
  db.all("SELECT * FROM fees", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// 5. جلب الدرجات
app.get('/api/grades', (req, res) => {
  db.all("SELECT * FROM grades", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// 6. جلب الحضور
app.get('/api/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// 7. تسجيل حضور
app.post('/api/attendance', (req, res) => {
  const { student_id, student_name, date, status } = req.body;
  db.run("INSERT INTO attendance (student_id, student_name, date, status) VALUES (?, ?, ?, ?)", 
    [student_id, student_name, date, status], function(err) {
      
      let whatsappMsg = null;
      if (status === 'absent') {
        whatsappMsg = `📱 [محاكاة WhatsApp] تم إرسال رسالة لولي أمر ${student_name}: نود إعلامكم بغياب ابنكم اليوم.`;
      }

      res.json({ success: true, message: "تم تسجيل الحضور", id: this.lastID, notification: whatsappMsg });
  });
});

// 8. عرض شهادة طالب
app.get('/certificate/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const data = await getStudentCertificate(studentId);
    const html = generateCertificateHTML(data);
    res.send(html);
  } catch (error) {
    res.status(404).send(`<h2 style="text-align:center; font-family:Arial;">❌ ${error}</h2>`);
  }
});

// التحقق من تسجيل الدخول
function checkAuth(req, res, next) {
  // السماح بالوصول لصفحة تسجيل الدخول والـ APIs العامة
  if (req.path === '/login.html' || req.path === '/api/login') {
    return next();
  }
  
  // في النسخة التجريبية، نتخطى التحقق (لاحقاً سنتحقق من Token)
  next();
}

app.use(checkAuth);

// إعادة توجيه الصفحة الرئيسية لصفحة تسجيل الدخول إذا لم يكن مسجلاً
app.get('/', (req, res) => {
  // في النسخة التجريبية، نعرض الواجهة مباشرة
  res.sendFile(__dirname + '/public/index.html');
});

// صفحة تسجيل الدخول
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});
// تشغيل الخادم
// ======== APIs لبيانات المدرسة ========

// جلب معلومات المدرسة
app.get('/api/school', (req, res) => {
  db.get("SELECT * FROM school_info", (err, row) => {
    res.json({ success: true, data: row });
  });
});

// جلب الفصول الدراسية
app.get('/api/terms', (req, res) => {
  db.all("SELECT * FROM terms", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// جلب الصفوف
app.get('/api/grades', (req, res) => {
  db.all("SELECT * FROM grades", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// جلب الشعب
app.get('/api/sections', (req, res) => {
  db.all("SELECT s.*, g.name as grade_name FROM sections s JOIN grades g ON s.grade_id = g.id", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// جلب المواد الدراسية
app.get('/api/subjects', (req, res) => {
  db.all("SELECT * FROM subjects", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// جلب المعلمين
app.get('/api/teachers', (req, res) => {
  db.all("SELECT t.*, s.name as subject_name FROM teachers t LEFT JOIN subjects s ON t.subject_id = s.id", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});

// جلب القاعات والمعامل
app.get('/api/rooms', (req, res) => {
  db.all("SELECT * FROM rooms", (err, rows) => {
    res.json({ success: true, data: rows });
  });
});
app.listen(PORT, () => {
  console.log(`🚀 النظام المتكامل يعمل على المنفذ ${PORT}`);
  console.log(`💾 قاعدة البيانات: school.db`);
  console.log(`🎨 الواجهة الاحترافية: http://localhost:${PORT}`);
});
