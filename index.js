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

// ======== الصفحات ========
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// ======== نظام الصلاحيات ========
const rolePermissions = {
  'مدير': ['*'],
  'تسجيل الطلاب': ['students', 'parents', 'attendance', 'school_info'],
  'التقارير': ['students', 'teachers', 'grades', 'attendance', 'fees', 'revenue', 'expenses', 'audit_log'],
  'الشؤون المالية': ['fees', 'revenue', 'expenses', 'students', 'parents']
};

function checkPermission(table) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'مدير';
    const permissions = rolePermissions[userRole] || [];
    if (permissions.includes('*') || permissions.includes(table)) {
      next();
    } else {
      res.status(403).json({ success: false, message: '⛔ ليس لديك صلاحية' });
    }
  };
}

// ======== تسجيل الدخول ========
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
    
    if (error || !users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'بيانات غير صحيحة' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });

    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ======== إدارة البيانات ========
const tables = ['students', 'teachers', 'employees', 'parents', 'attendance', 'fees', 'grades', 'exams', 'schedules', 'revenue', 'expenses', 'clinic', 'transport', 'library', 'inventory', 'calendar_events', 'audit_log', 'school_info'];

// GET
tables.forEach(table => {
  app.get(`/api/${table}`, checkPermission(table), async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) return res.status(500).json({ success: false, message: error.message });
      res.json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});
