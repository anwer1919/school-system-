const express = require('express');
const cors = require('cors');
const authRoutes = require('./auth');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ======== بيانات المدرسة ========
const schoolInfo = {
  name: "مدرسة النور الخاصة",
  year: "2026-2027",
  terms: ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"],
  grades: [
    { name: "الصف الأول", sections: ["أ", "ب", "ج"] },
    { name: "الصف الثاني", sections: ["أ", "ب"] },
    { name: "الصف الثالث", sections: ["أ", "ب", "ج", "د"] }
  ]
};

const students = [
  { id: 1, name: "أحمد محمد", grade: "الصف الأول", section: "أ", status: "نشط" },
  { id: 2, name: "سارة علي", grade: "الصف الثاني", section: "ب", status: "نشط" },
  { id: 3, name: "يوسف خالد", grade: "الصف الثالث", section: "ج", status: "نشط" }
];

const attendance = [
  { id: 1, studentId: 1, studentName: "أحمد محمد", date: "2026-07-26", status: "present" },
  { id: 2, studentId: 2, studentName: "سارة علي", date: "2026-07-26", status: "absent" },
  { id: 3, studentId: 3, studentName: "يوسف خالد", date: "2026-07-26", status: "late" }
];

// ======== المسارات (API Routes) ========

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "🏫 نظام إدارة مدرسة النور",
    endpoints: {
      "معلومات المدرسة": "/api/school",
      "الطلاب": "/api/students",
      "إضافة طالب": "POST /api/students",
      "الحضور": "/api/attendance",
      "تسجيل الحضور": "POST /api/attendance",
      "تسجيل الدخول": "POST /api/auth/login",
      "المستخدمون": "/api/auth/users"
    }
  });
});

// معلومات المدرسة
app.get('/api/school', (req, res) => {
  res.json({ success: true, data: schoolInfo });
});

// جلب الطلاب
app.get('/api/students', (req, res) => {
  res.json({ success: true, count: students.length, data: students });
});

// إضافة طالب جديد
app.post('/api/students', (req, res) => {
  const { name, grade, section } = req.body;
  const newStudent = {
    id: students.length + 1,
    name: name || "طالب جديد",
    grade: grade || "غير محدد",
    section: section || "غير محدد",
    status: "نشط"
  };
  students.push(newStudent);
  res.status(201).json({ success: true, message: "تم إضافة الطالب بنجاح ✅", data: newStudent });
});

// حذف طالب
app.delete('/api/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "الطالب غير موجود" });
  }
  students.splice(index, 1);
  res.json({ success: true, message: "تم حذف الطالب بنجاح 🗑️" });
});

// جلب الحضور
app.get('/api/attendance', (req, res) => {
  const present = attendance.filter(a => a.status === "present").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const late = attendance.filter(a => a.status === "late").length;

  res.json({
    success: true,
    summary: { present, absent, late, total: attendance.length },
    data: attendance
  });
});

// تسجيل حضور طالب
app.post('/api/attendance', (req, res) => {
  const { studentId, studentName, date, status } = req.body;
  const record = {
    id: attendance.length + 1,
    studentId,
    studentName,
    date: date || new Date().toISOString().split('T')[0],
    status: status || "present"
  };
  attendance.push(record);

  // إذا كان غائب، يتم إرسال إشعار (محاكاة)
  let notification = null;
  if (status === "absent") {
    notification = `📱 تم إرسال إشعار لولي أمر ${studentName}: ابنكم غائب اليوم`;
  }

  res.status(201).json({
    success: true,
    message: "تم تسجيل الحضور بنجاح ✅",
    data: record,
    notification
  });
});

// ربط نظام تسجيل الدخول
app.use('/api/auth', authRoutes);

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 نظام إدارة المدرسة يعمل على المنفذ ${PORT}`);
  console.log(`📊 عدد الطلاب: ${students.length}`);
  console.log(`📅 تاريخ اليوم: ${new Date().toLocaleDateString('ar-EG')}`);
});
