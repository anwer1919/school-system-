require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ======== GET - جلب البيانات ========
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
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== POST - إضافة طالب جديد ========
app.post('/api/students', async (req, res) => {
  console.log('📝 POST /api/students');
  console.log('📦 البيانات المستلمة:', req.body);
  
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([req.body])
      .select();
    
    if (error) {
      console.error('❌ خطأ في الإضافة:', error.message);
      console.error('🔍 التفاصيل:', error.details);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.details 
      });
    }
    
    console.log('✅ تم الإضافة بنجاح:', data[0]);
    res.json({ success: true, data: data[0], message: '✅ تمت الإضافة بنجاح' });
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== PUT - تعديل طالب ========
app.put('/api/students/:id', async (req, res) => {
  console.log('✏️ PUT /api/students/' + req.params.id);
  console.log('📦 البيانات:', req.body);
  
  try {
    const { data, error } = await supabase
      .from('students')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) {
      console.error('❌ خطأ في التعديل:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ تم التعديل بنجاح');
    res.json({ success: true, message: '✅ تم التعديل بنجاح' });
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== DELETE - حذف طالب ========
app.delete('/api/students/:id', async (req, res) => {
  console.log('🗑️ DELETE /api/students/' + req.params.id);
  
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('❌ خطأ في الحذف:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ تم الحذف بنجاح');
    res.json({ success: true, message: '🗑️ تم الحذف بنجاح' });
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// بدء الخادم
app.listen(3000, () => {
  console.log('🚀 الخادم يعمل على المنفذ 3000');
});
