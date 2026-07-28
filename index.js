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

// GET - جلب الطلاب
app.get('/api/students', async (req, res) => {
  console.log('🔔 GET /api/students');
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      console.error('❌ خطأ:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    console.log('✅ عدد الطلاب:', data.length);
    res.json({ success: true, count: data.length, data: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - إضافة طالب
app.post('/api/students', async (req, res) => {
  console.log('📝 POST /api/students');
  console.log('📦 البيانات:', req.body);
  
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([req.body])
      .select();
    
    if (error) {
      console.error('❌ خطأ:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ تم الإضافة:', data[0]);
    res.json({ success: true, data: data[0], message: '✅ تمت الإضافة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT - تعديل طالب
app.put('/api/students/:id', async (req, res) => {
  console.log('✏️ PUT /api/students/' + req.params.id);
  
  try {
    const { data, error } = await supabase
      .from('students')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) {
      console.error('❌ خطأ:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ تم التعديل');
    res.json({ success: true, message: '✅ تم التعديل بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - حذف طالب
app.delete('/api/students/:id', async (req, res) => {
  console.log('🗑️ DELETE /api/students/' + req.params.id);
  
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('❌ خطأ:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ تم الحذف');
    res.json({ success: true, message: '🗑️ تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🚀 الخادم يعمل على المنفذ 3000');
});
