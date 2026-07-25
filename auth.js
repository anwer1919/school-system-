const express = require('express');
const router = express.Router();

// بيانات المستخدمين (مؤقتة - سنستبدلها بقاعدة بيانات لاحقاً)
const users = [
  {
    id: 1,
    email: "admin@school.com",
    password: "admin123",
    name: "المدير العام",
    role: "admin"
  },
  {
    id: 2,
    email: "teacher@school.com",
    password: "teacher123",
    name: "أ. محمد أحمد",
    role: "teacher"
  },
  {
    id: 3,
    email: "parent@school.com",
    password: "parent123",
    name: "أ. فاطمة علي",
    role: "parent"
  }
];

// تسجيل الدخول
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة"
    });
  }

  // إخفاء كلمة المرور قبل الإرسال
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: `✅ مرحباً ${user.name}`,
    data: userWithoutPassword
  });
});

// جلب قائمة المستخدمين
router.get('/users', (req, res) => {
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json({ success: true, data: safeUsers });
});

module.exports = router;
