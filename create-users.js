require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createUsers() {
  try {
    console.log('🔄 جاري إنشاء المستخدمين...');
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      { name: 'أ. محمد المدير', email: 'admin@school.com', role: 'مدير', phone: '01000000001' },
      { name: 'أ. سارة - تسجيل الطلاب', email: 'students@school.com', role: 'تسجيل الطلاب', phone: '01000000002' },
      { name: 'أ. أحمد - التقارير', email: 'reports@school.com', role: 'التقارير', phone: '01000000003' },
      { name: 'أ. فاطمة - الشؤون المالية', email: 'finance@school.com', role: 'الشؤون المالية', phone: '01000000004' }
    ];

    for (const user of users) {
      await supabase.from('users').delete().eq('email', user.email);
      await supabase.from('users').insert([{ ...user, password: hashedPassword }]);
      console.log(`✅ تم إنشاء: ${user.name} (${user.role})`);
    }

    console.log('\n🎉 تم إنشاء كل المستخدمين بنجاح!');
    console.log('\n📋 بيانات الدخول (كلمة المرور: 123456):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 admin@school.com');
    console.log('📝 students@school.com');
    console.log('📊 reports@school.com');
    console.log('💰 finance@school.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
}

createUsers();
