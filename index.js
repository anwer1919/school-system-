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

// التحقق من الاتصال
async function checkConnection() {
  const { data, error } = await supabase.from('school_info').select('*').limit(1);
  if (error) console.error('❌ خطأ:', error.message);
  else console.log('✅ تم الاتصال بـ Supabase بنجاح!');
}

// سجل النشاط
async function logAction(userName, action, details) {
  try {
    await supabase.from('audit_log').insert([{
      user_name: userName,
      action: action,
      details: details,
      date: new Date().toLocaleString('ar-EG')
    }]);
  } catch (err) { console.error('Audit error:', err.message); }
}

// الصفحات
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });

    const { data: users, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
    if (error || !users || users.length === 0) return res.status(401).json({ success: false, message: 'بيانات غير صحيحة' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });

    await logAction(user.name, 'تسجيل دخول', 'دخول ناجح');
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET لكل الجداول
const tables = ['students','teachers','employees','parents','attendance','fees','grades','exams','schedules','revenue','expenses','notifications','audit_log','school_info','terms','grades_levels','sections','rooms','subjects','clinic','transport','library','inventory','calendar_events','settings'];

tables.forEach(table => {
  app.get(`/api/${table}`, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) return res.status(500).json({ success: false, message: error.message });
      if (table === 'school_info') res.json({ success: true, data: data?.[0] || null });
      else res.json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});

// POST (إضافة)
const createConfig = {
  students: { action: 'إضافة طالب' }, teachers: { action: 'إضافة معلم' },
  employees: { action: 'إضافة موظف' }, parents: { action: 'إضافة ولي أمر' },
  subjects: { action: 'إضافة مادة' }, exams: { action: 'إضافة امتحان' },
  fees: { action: 'إضافة رسم' }, attendance: { action: 'تسجيل حضور' },
  grades: { action: 'رصد درجة' }, schedules: { action: 'إضافة حصة' },
  revenue: { action: 'إضافة إيراد' }, expenses: { action: 'إضافة مصروف' },
  clinic: { action: 'سجل عيادة' }, transport: { action: 'إضافة باص' },
  library: { action: 'إضافة كتاب' }, inventory: { action: 'إضافة صنف' },
  calendar_events: { action: 'إضافة حدث' }
};

Object.keys(createConfig).forEach(table => {
  app.post(`/api/${table}`, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).insert([req.body]).select();
      if (error) return res.status(500).json({ success: false, message: error.message });
      await logAction('المستخدم', createConfig[table].action, JSON.stringify(req.body));
      res.json({ success: true, data: data[0], message: '✅ تمت الإضافة بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});

// PUT (تعديل)
Object.keys(createConfig).forEach(table => {
  app.put(`/api/${table}/:id`, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select();
      if (error) return res.status(500).json({ success: false, message: error.message });
      await logAction('المستخدم', 'تعديل', `${table} #${req.params.id}`);
      res.json({ success: true, message: '✅ تم التعديل بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});

// DELETE (حذف)
Object.keys(createConfig).forEach(table => {
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ success: false, message: error.message });
      await logAction('المستخدم', 'حذف', `${table} #${req.params.id}`);
      res.json({ success: true, message: '🗑️ تم الحذف بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  });
});

// الشهادات
app.get('/certificate/:id', async (req, res) => {
  try {
    const { data: students } = await supabase.from('students').select('*').eq('id', req.params.id).limit(1);
    if (!students || students.length === 0) return res.status(404).send('الطالب غير موجود');
    const student = students[0];

    const { data: gradesData } = await supabase.from('grades').select('*').eq('student_id', req.params.id);
    let ts = 0, tm = 0;
    (gradesData || []).forEach(g => { ts += g.score; tm += g.max_score; });
    const p = tm > 0 ? ((ts / tm) * 100).toFixed(2) : 0;
    const g = p >= 90 ? 'ممتاز' : p >= 80 ? 'جيد جداً' : p >= 70 ? 'جيد' : p >= 60 ? 'مقبول' : 'ضعيف';

    res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>شهادة - ${student.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
body{font-family:'Amiri',serif;background:linear-gradient(135deg,#667eea,#764ba2);margin:0;padding:40px 20px}
.cert{max-width:800px;margin:auto;background:white;padding:60px 40px;border:15px double #d4af37;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.hdr{text-align:center;border-bottom:3px double #d4af37;padding-bottom:20px;margin-bottom:30px}
.hdr h1{color:#1e40af;font-size:42px;margin:0}
.ttl{text-align:center;font-size:36px;color:#d4af37;margin:30px 0;font-weight:bold}
.sn{text-align:center;font-size:32px;color:#1e40af;margin:20px 0;border-bottom:2px solid #d4af37;display:inline-block;padding:0 40px 10px}
table{width:100%;border-collapse:collapse;margin:30px 0}
th{background:#1e40af;color:white;padding:12px}
td{padding:12px;border:1px solid #ddd;text-align:center}
.sum{background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0;text-align:center;font-size:20px}
.pct{font-size:48px;color:#1e40af;font-weight:bold}
.grd{font-size:32px;color:#d4af37;font-weight:bold}
.pbtn{display:block;margin:20px auto;padding:15px 40px;background:#1e40af;color:white;border:none;border-radius:5px;font-size:18px;cursor:pointer}
@media print{body{background:white;padding:0}.pbtn{display:none}}
</style></head><body>
<div class="cert">
<div class="hdr"><h1>🏫 مدرسة النور الخاصة</h1></div>
<div class="ttl">شهادة تقدير</div>
<div style="text-align:center"><p style="font-size:20px">تشهد المدرسة بأن الطالب</p><div class="sn">${student.name}</div><p style="font-size:20px">الصف ${student.grade} - شعبة ${student.section}</p></div>
<table><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr>
${(gradesData || []).map(g=>`<tr><td>${g.subject}</td><td>${g.score}</td><td>${g.max_score}</td><td>${((g.score/g.max_score)*100).toFixed(1)}%</td></tr>`).join('')}
</table>
<div class="sum"><div>المجموع</div><div class="pct">${ts}/${tm}</div><div>النسبة: ${p}%</div><div class="grd">التقدير: ${g}</div></div>
</div>
<button class="pbtn" onclick="window.print()">🖨️ طباعة</button>
</body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في الخادم');
  }
});

// التقارير
function makeReport(title, headers, rows, extra = '') {
  const rowsHtml = rows && rows.length > 0 ? rows : '<tr><td colspan="' + headers.length + '" style="text-align:center;padding:20px;color:#999;">لا توجد بيانات</td></tr>';
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;background:#f5f5f5}h1{text-align:center;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.1)}th{background:#1e40af;color:white;padding:12px}td{padding:10px;border:1px solid #ddd;text-align:center}tr:nth-child(even){background:#f9f9f9}.summary{background:#f0f9ff;padding:20px;border-radius:10px;text-align:center;margin:20px 0;border:2px solid #3b82f6}.pbtn{display:block;margin:30px auto;padding:12px 40px;background:#1e40af;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px}@media print{.pbtn{display:none}body{background:white}}</style></head>
<body><h1>${title}</h1><p style="text-align:center">تاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>${extra}
<table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rowsHtml}</table>
<button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`;
}

app.get('/api/reports/students', async (req, res) => {
  const { data } = await supabase.from('students').select('*');
  const r = (data || []).map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.seat_number||'-'}</td><td>${s.status}</td></tr>`).join('');
  res.send(makeReport('📄 تقرير الطلاب', ['الرقم','الاسم','الصف','الشعبة','رقم الجلوس','الحالة'], r));
});

app.get('/api/reports/attendance', async (req, res) => {
  const { data } = await supabase.from('attendance').select('*');
  const r = (data || []).map(a => `<tr><td>${a.student_name}</td><td>${a.date}</td><td>${a.status==='present'?'حاضر':a.status==='absent'?'غائب':'متأخر'}</td></tr>`).join('');
  res.send(makeReport('📅 تقرير الحضور', ['الطالب','التاريخ','الحالة'], r));
});

app.get('/api/reports/fees', async (req, res) => {
  const { data } = await supabase.from('fees').select('*');
  let total=0,paid=0;
  (data || []).forEach(f=>{total+=f.amount;if(f.status==='paid')paid+=f.amount;});
  const r = (data || []).map(f => `<tr><td>${f.student_name}</td><td>${f.amount} جنيه</td><td>${f.type||'-'}</td><td>${f.due_date||'-'}</td><td>${f.status==='paid'?'مدفوع':'غير مدفوع'}</td></tr>`).join('');
  res.send(makeReport('💰 التقرير المالي', ['الطالب','المبلغ','النوع','الاستحقاق','الحالة'], r, `<div class="summary"><b>الإجمالي: ${total} | المدفوع: ${paid} | المتبقي: ${total-paid}</b></div>`));
});

app.get('/api/reports/grades', async (req, res) => {
  const { data } = await supabase.from('grades').select('*');
  const r = (data || []).map(g => { const p=((g.score/g.max_score)*100).toFixed(1); const gr=p>=90?'ممتاز':p>=70?'جيد':'مقبول'; return `<tr><td>${g.student_name}</td><td>${g.subject}</td><td>${g.score}/${g.max_score}</td><td>${p}%</td><td>${gr}</td></tr>`; }).join('');
  res.send(makeReport('🎯 كشوف الدرجات', ['الطالب','المادة','الدرجة','النسبة','التقدير'], r));
});

app.get('/api/reports/teachers', async (req, res) => {
  const { data } = await supabase.from('teachers').select('*');
  const r = (data || []).map(t => `<tr><td>${t.name}</td><td>${t.email}</td><td>${t.phone}</td><td>${t.salary||0} جنيه</td></tr>`).join('');
  res.send(makeReport('👨‍🏫 تقرير المعلمين', ['الاسم','البريد','الهاتف','الراتب'], r));
});

app.get('/api/reports/financial', async (req, res) => {
  const { data: rev } = await supabase.from('revenue').select('*');
  const { data: exp } = await supabase.from('expenses').select('*');
  let tr=0,te=0;
  (rev || []).forEach(r=>tr+=r.amount);
  (exp || []).forEach(e=>te+=e.amount);
  const rr = (rev || []).map(r=>`<tr><td>${r.source}</td><td>${r.amount} جنيه</td><td>${r.date}</td></tr>`).join('');
  const er = (exp || []).map(e=>`<tr><td>${e.category}</td><td>${e.amount} جنيه</td><td>${e.date}</td></tr>`).join('');
  res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي الشامل</title><style>body{font-family:Arial;padding:40px}h1{text-align:center;color:#1e40af}h2{color:#1e40af;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:10px;background:white}th{background:#1e40af;color:white;padding:10px}td{padding:8px;border:1px solid #ddd;text-align:center}.summary{background:#f0f9ff;padding:15px;border-radius:10px;text-align:center;margin:20px 0}.pbtn{display:block;margin:20px auto;padding:10px 30px;background:#1e40af;color:white;border:none;border-radius:5px;cursor:pointer}@media print{.pbtn{display:none}}</style></head><body><h1>💰 التقرير المالي الشامل</h1><div class="summary"><b>الإيرادات: ${tr} | المصروفات: ${te} | الصافي: ${tr-te}</b></div><h2>📈 الإيرادات</h2><table><tr><th>المصدر</th><th>المبلغ</th><th>التاريخ</th></tr>${rr||'<tr><td colspan="3" style="text-align:center;padding:20px;color:#999">لا توجد إيرادات</td></tr>'}</table><h2>📉 المصروفات</h2><table><tr><th>البند</th><th>المبلغ</th><th>التاريخ</th></tr>${er||'<tr><td colspan="3" style="text-align:center;padding:20px;color:#999">لا توجد مصروفات</td></tr>'}</table><button class="pbtn" onclick="window.print()">🖨️ طباعة</button></body></html>`);
});

app.listen(PORT, async () => {
  console.log(`🚀 النظام يعمل على المنفذ ${PORT}`);
  await checkConnection();
});
