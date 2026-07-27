require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// الاتصال بـ Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// صفحة تجريبية للتأكد من أن النظام يعمل
app.get('/', (req, res) => {
  res.send('<h1 style="text-align:center; margin-top:50px; font-family:Arial; color:#1e40af;">🚀 النظام يعمل بنجاح! الاتصال بقاعدة البيانات ناجح.</h1>');
});

// تشغيل الخادم والتحقق من الاتصال
app.listen(PORT, async () => {
  console.log(`🚀 النظام يعمل على المنفذ ${PORT}`);
  
  const { data, error } = await supabase.from('school_info').select('*').limit(1);
  if (error) {
    console.error('❌ خطأ في الاتصال بـ Supabase:', error.message);
  } else {
    console.log('✅ تم الاتصال بـ Supabase بنجاح!');
  }
});
