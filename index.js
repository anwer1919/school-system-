try {
  console.log('🔍 بدء التشغيل...');
  
  require('dotenv').config();
  console.log('✅ تم تحميل .env');
  
  const express = require('express');
  console.log('✅ تم تحميل express');
  
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ تم تحميل supabase-js');
  
  // التحقق من وجود المتغيرات
  if (!process.env.SUPABASE_URL) {
    console.error('❌ خطأ: SUPABASE_URL غير موجود في .env');
    console.log('💡 تأكد من وجود ملف .env يحتوي على:');
    console.log('   SUPABASE_URL=https://xxxxx.supabase.co');
    console.log('   SUPABASE_KEY=eyJ...');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_KEY) {
    console.error('❌ خطأ: SUPABASE_KEY غير موجود في .env');
    process.exit(1);
  }
  
  console.log('📡 SUPABASE_URL:', process.env.SUPABASE_URL.substring(0, 30) + '...');
  
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log('✅ تم إنشاء اتصال Supabase');
  
  // الصفحات
  app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
  app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
  
  // اختبار الاتصال
  app.get('/api/test', async (req, res) => {
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) return res.json({ ok: false, error: error.message });
    res.json({ ok: true, count: data.length });
  });
  
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`🚀 النظام يعمل بنجاح على المنفذ ${PORT}`);
    console.log('═══════════════════════════════════════');
  });
  
} catch (err) {
  console.error('');
  console.error('❌❌❌ خطأ فادح أثناء التشغيل ❌❌❌');
  console.error('الرسالة:', err.message);
  console.error('الموقع:', err.stack);
  console.error('');
}
