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

// API الطلاب - مع معالجة أخطاء كاملة
app.get('/api/students', async (req, res) => {
  console.log('🔔 تم طلب /api/students');
  
  try {
    const { data, error } = await supabase.from('students').select('*');
    
    if (error) {
      console.error('❌ خطأ Supabase:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.details 
      });
    }
    
    console.log('✅ عدد الطلاب:', data ? data.length : 0);
    console.log('📦 البيانات:', JSON.stringify(data));
    
    res.json({ 
      success: true, 
      count: data ? data.length : 0,
      data: data || [] 
    });
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// بدء الخادم
app.listen(3000, () => {
  console.log('🚀 الخادم يعمل على المنفذ 3000');
  console.log('📡 افتح المتصفح على: http://localhost:3000');
});
