require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkConnection() {
  const { data, error } = await supabase.from('school_info').select('*').limit(1);
  if (error) console.error('❌ خطأ الاتصال:', error.message);
  else console.log('✅ تم الاتصال بـ Supabase بنجاح!');
}

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// ======== نقطة التشخيص الحاسمة للطلاب ========
app.get('/api/students', async (req, res) => {
  console.log('🔍 [Backend] تم طلب بيانات الطلاب من المتصفح...');
  const { data, error } = await supabase.from('students').select('*');
  
  if (error) {
    console.error('❌ [Backend] خطأ من Supabase:', error.message, error.details);
    return res.status(500).json({ success: false, message: error.message });
  }
  
  console.log('✅ [Backend] تم جلب البيانات بنجاح. العدد:', data ? data.length : 0);
  console.log('📦 [Backend] البيانات هي:', JSON.stringify(data));
  
  res.json({ success: true, count: data ? data.length : 0, data: data || [] });
});

// ======== نقطة التشخيص الحاسمة للمعلمين ========
app.get('/api/teachers', async (req, res) => {
  console.log('🔍 [Backend] تم طلب بيانات المعلمين...');
  const { data, error } = await supabase.from('teachers').select('*');
  if (error) {
    console.error('❌ [Backend] خطأ المعلمين:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
  console.log('✅ [Backend] تم جلب المعلمين. العدد:', data ? data.length : 0);
  res.json({ success: true, count: data ? data.length : 0, data: data || [] });
});

// (باقي الـ APIs كما هي، لكن ركزنا على الطلاب والمعلمين للتشخيص)
const otherTables = ['employees','parents','attendance','fees','grades','exams','schedules','revenue','expenses','notifications','audit_log','school_info','terms','grades_levels','sections','rooms','subjects','clinic','transport','library','inventory','calendar_events','settings'];

otherTables.forEach(table => {
  app.get(`/api/${table}`, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) return res.status(500).json({ success: false, message: error.message });
      res.json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});

// تقارير (للمقارنة)
app.get('/api/reports/students', async (req, res) => {
  const { data } = await supabase.from('students').select('*');
  const r = (data || []).map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td></tr>`).join('');
  res.send(`<h1>تقرير الطلاب</h1><table border="1">${r}</table>`);
});

app.listen(PORT, async () => {
  console.log(`🚀 النظام يعمل على المنفذ ${PORT}`);
  await checkConnection();
});
