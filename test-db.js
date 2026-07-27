require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔄 جاري اختبار الاتصال بقاعدة البيانات...');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function runTest() {
  // 1. محاولة قراءة البيانات
  console.log('📖 جاري قراءة البيانات...');
  const { data: readData, error: readError } = await supabase.from('students').select('*');
  
  if (readError) {
    console.error('❌ فشل القراءة:', readError.message);
    console.error('🔍 التفاصيل:', readError.details);
    return;
  }
  console.log('✅ نجاح القراءة! عدد الطلاب:', readData.length);
  console.log('البيانات:', readData);

  // 2. محاولة إضافة بيانات جديدة
  console.log('\n➕ جاري إضافة طالب جديد...');
  const { data: insertData, error: insertError } = await supabase
    .from('students')
    .insert([{ name: 'طالب اختبار جذري', grade: 'الثالث', section: 'ج', status: 'نشط' }])
    .select();

  if (insertError) {
    console.error('❌ فشل الإضافة:', insertError.message);
    console.error('🔍 التفاصيل:', insertError.details);
    return;
  }
  console.log('✅ نجاح الإضافة! البيانات المضافة:', insertData);
  console.log('\n🎉 قاعدة البيانات تعمل بنسبة 100%');
}

runTest();
