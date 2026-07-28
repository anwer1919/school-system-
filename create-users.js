require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createUsers() {
  console.log('🔄 جاري إنشاء المستخدمين...\n');
  
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('✅ تم تشفير كلمة المرور بنجاح\n');

  const users = [
    { name: 'أ. محمد المدير', email: 'admin@school.com', role: 'مدير', phone: '01000000001' },
    { name: 'أ. سارة - تسجيل الطلاب', email: 'students@school.com', role: 'تسجيل الطلاب', phone: '01000000002' },
    { name: 'أ. أحمد - التقارير', email: 'reports@school.com', role: 'التقارير', phone: '01000000003' },
    { name: 'أ. فاطمة - الشؤون المالية', email: 'finance@school.com', role: 'الشؤون المالية', phone: '01000000004' }
  ];

  for (const user of users) {
    // حذف المستخدم القديم إذا كان موجوداً
    await supabase.from('users').delete().eq('email', user.email);
    
    // إضافة المستخدم الجديد
    const { data, error } = await supabase.from('users').insert([{
      ...user,
      password: hashedPassword
    }]).select();
    
    if (error) {
      console.error(`❌ خطأ في إنشاء ${user.name}:`, error.message);
    } else {
      console.log(`✅ تم إنشاء: ${user.name} (${user.role})`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 تم إنشاء كل المستخدمين بنجاح!');
  console.log('═══════════════════════════════════════');
  console.log('\n📋 بيانات الدخول (كلمة المرور: 123456):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 المدير: admin@school.com');
  console.log('📝 تسجيل الطلاب: students@school.com');
  console.log('📊 التقارير: reports@school.com');
  console.log('💰 الشؤون المالية: finance@school.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createUsers().catch(err => {
  console.error('❌ خطأ فادح:', err.message);
});
