require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// توجيه الصفحات
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// نظام الصلاحيات
const rolePermissions = {
  'مدير': ['*'],
  'تسجيل الطلاب': ['students', 'parents', 'attendance', 'school_info'],
  'التقارير': ['students', 'teachers', 'attendance', 'fees', 'revenue', 'expenses'],
  'الشؤون المالية': ['fees', 'revenue', 'expenses', 'students', 'parents']
};

function checkPermission(table) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'مدير';
    const permissions = rolePermissions[userRole] || [];
    if (permissions.includes('*') || permissions.includes(table)) {
      return next();
    }
    console.log(`⛔ [حظر صلاحيات] المستخدم: ${userRole} حاول الوصول لـ: ${table}`);
    res.status(403).json({ success: false, message: '⛔ ليس لديك صلاحية للوصول لهذا القسم' });
  };
}

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
    if (error || !users || users.length === 0) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    const user = users[0];
    // ملاحظة: إذا لم تكن قد أنشأت مستخدمين بكلمة مرور مشفرة، استخدم هذا السطر مؤقتاً للتجربة:
    // const isMatch = (password === user.password || password === '123456'); 
    const isMatch = await bcrypt.compare(password, user.password).catch(() => password === '123456'); // Fallback للتجربة
    
    if (!isMatch) return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });

    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + err.message });
  }
});

// ======== المحرك الديناميكي للـ CRUD (يعمل على كل الجداول) ========
const tables = ['students', 'teachers', 'parents', 'attendance', 'fees', 'revenue', 'expenses', 'school_info'];

// 1. GET (جلب البيانات)
tables.forEach(table => {
  app.get(`/api/${table}`, checkPermission(table), async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*').order('id', { ascending: false });
      if (error) {
        console.error(`❌ خطأ GET ${table}:`, error.message);
        return res.status(500).json({ success: false, message: error.message });
      }
      res.json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// 2. POST (إضافة)
tables.forEach(table => {
  app.post(`/api/${table}`, checkPermission(table), async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).insert([req.body]).select();
      if (error) {
        console.error(`❌ خطأ POST ${table}:`, error.message, error.details);
        return res.status(500).json({ success: false, message: error.message + ' | ' + (error.details || '') });
      }
      res.json({ success: true, data: data[0], message: '✅ تمت الإضافة بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// 3. DELETE (حذف)
tables.forEach(table => {
  app.delete(`/api/${table}/:id`, checkPermission(table), async (req, res) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ success: false, message: error.message });
      res.json({ success: true, message: '🗑️ تم الحذف بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// التقارير
app.get('/api/reports/students', async (req, res) => {
  const { data } = await supabase.from('students').select('*');
  const rows = (data || []).map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.status}</td></tr>`).join('');
  res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير الطلاب</title><style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse}th,td{padding:12px;border:1px solid #ddd;text-align:center}th{background:#1e40af;color:white}</style></head><body><h1 style="text-align:center">📄 تقرير الطلاب الشامل</h1><table><tr><th>م</th><th>الاسم</th><th>الصف</th><th>الشعبة</th><th>الحالة</th></tr>${rows}</table><br><button onclick="window.print()" style="padding:10px 20px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px">🖨️ طباعة التقرير</button></body></html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`🚀 النظام يعمل بنجاح على المنفذ ${PORT}`);
  console.log(`═══════════════════════════════════════\n`);
});
