require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/students', async (req, res) => {
  console.log('🔔 GET /api/students');
  const { data, error } = await supabase.from('students').select('*');
  if (error) {
    console.error('❌ خطأ:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
  console.log('✅ عدد الطلاب:', data.length);
  res.json({ success: true, count: data.length, data: data });
});

app.post('/api/students', async (req, res) => {
  console.log('📝 POST /api/students');
  console.log('📦 البيانات:', req.body);
  
  const { data, error } = await supabase
    .from('students')
    .insert([req.body])
    .select();
  
  if (error) {
    console.error('❌ خطأ:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
  
  console.log('✅ تم الإضافة:', data[0]);
  res.json({ success: true, data: data[0] });
});

app.listen(3000, () => {
  console.log('🚀 الخادم يعمل على المنفذ 3000');
});
