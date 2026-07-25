const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ======== واجهة الويب البسيطة (Dashboard) ========
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>نظام مدرسة النور</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; }
        .card { background: #e0e7ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .btn { display: block; width: 100%; padding: 12px; margin: 10px 0; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #1e3a8a; }
        pre { background: #1e293b; color: #a5f3fc; padding: 15px; border-radius: 5px; overflow-x: auto; direction: ltr; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏫 نظام إدارة مدرسة النور (Pro)</h1>
        <p style="text-align:center; color:#666;">نظام متكامل: قاعدة بيانات + تشفير + رسوم + درجات</p>
        
        <button class="btn" onclick="loadData('/api/students')">👥 عرض الطلاب</button>
        <button class="btn" onclick="loadData('/api/fees')">💰 عرض الرسوم المالية</button>
        <button class="btn" onclick="loadData('/api/grades')">📊 عرض الدرجات</button>
        <button class="btn" onclick="loadData('/api/attendance')">📅 عرض الحضور</button>
        
        <div class="card">
          <h3>📡 نتيجة الطلب:</h3>
          <pre id="output">اضغط على أي زر أعلاه لعرض البيانات...</pre>
        </div>
      </div>
      <script>
        async function loadData(endpoint) {
          document.getElementById('output').innerText = 'جاري التحميل...';
          try {
            const response = await fetch(endpoint);
            const data = await response.json();
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('output').innerText = 'خطأ: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// ======== واجهات برمجة التطبيقات (APIs) ========

// 1. تسجيل الدخول (مع التحقق من كلمة المرور المشفرة)
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

// 7. تسجيل حضور (مع محاكاة إشعار WhatsApp)
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

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 النظام المتكامل يعمل على المنفذ ${PORT}`);
  console.log(`💾 قاعدة البيانات: school.db (محلية وآمنة)`);
});
