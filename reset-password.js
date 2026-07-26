require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function resetPassword() {
  try {
    console.log('🔄 جاري تحديث كلمة مرور المدير...');
    
    // توليد hash صحيح لكلمة المرور admin123
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('✅ تم توليد كلمة مرور مشفرة جديدة');
    
    // تحديث كلمة المرور في قاعدة البيانات
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', 'admin@school.com');
    
    if (error) {
      console.error('❌ خطأ:', error.message);
      return;
    }
    
    console.log('✅ تم تحديث كلمة المرور بنجاح!');
    console.log('');
    console.log('📧 البريد: admin@school.com');
    console.log('🔑 كلمة المرور: admin123');
    console.log('');
    console.log('🎉 يمكنك الآن تسجيل الدخول!');
    console.log('⚠️  يمكنك حذف هذا الملف بعد النجاح (reset-password.js)');
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
}

resetPassword();
