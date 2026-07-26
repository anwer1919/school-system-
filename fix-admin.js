require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function fixAdmin() {
  try {
    console.log('🔄 جاري إصلاح حساب المدير...');
    
    // حذف الحساب القديم إذا كان موجوداً
    await supabase.from('users').delete().eq('email', 'admin@school.com');
    console.log('✅ تم حذف الحساب القديم');
    
    // إنشاء حساب جديد بكلمة مرور: admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: 'المدير العام',
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'مدير',
        phone: '01000000001'
      }]);
    
    if (error) {
      console.error('❌ خطأ:', error.message);
      return;
    }
    
    console.log('✅ تم إنشاء حساب المدير بنجاح!');
    console.log('');
    console.log('📧 البريد: admin@school.com');
    console.log('🔑 كلمة المرور: admin123');
    console.log('');
    console.log('🎉 يمكنك الآن تسجيل الدخول!');
    console.log('⚠️  احذف هذا الملف بعد النجاح');
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
}

fixAdmin();
