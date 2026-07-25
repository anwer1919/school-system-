const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { getStudentCertificate, generateCertificateHTML } = require('./certificate');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ======== واجهة الويب الرئيسية ========
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>نظام مدرسة النور</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; }
        .card { background: #e0e7ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .btn { display: block; width: 100%; padding: 12px; margin: 10px 0; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; text-decoration: none; text-align: center; }
        .btn:hover { background: #1e3a8a; }
        pre { background: #1e293b; color: #a5f3fc; padding: 15px; border-radius: 5px; overflow-x: auto; direction: ltr; text-align: left; }
        .student-card { background: #f0f9ff; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏫 نظام إدارة مدرسة النور (Pro)</h1>
        <p style="text-align:center; color:#666;">نظام متكامل: قاعدة بيانات + تشفير + رسوم + درجات + شهادات</p>
        
        <button class="btn" onclick="loadData('/api/students')">👥 عرض الطلاب</button>
        <button class="btn" onclick="loadData('/api/fees')">💰 عرض الرسوم المالية</button>
        <button class="btn" onclick="loadData('/api/grades')">📊 عرض الدرجات</button>
        <button class="btn" onclick="loadData('/api/attendance')">📅 عرض الحضور</button>
        <button class="btn" onclick="loadStudents()">🎓 عرض الشهادات</button>
        
        <div class="card">
          <h3>📡 نتيجة الطلب:</h3>
          <pre id="output">اضغط على أي زر أعلاه لعرض البيانات...</pre>
        </div>
      </div>
      <script>
        async function loadData(endpoint) {
          document.getElementById('output').innerText = 'جاري التحميل...';
          try {
            const response = await fetch(endpoint);
            const data = await response.json();
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('output').innerText = 'خطأ: ' + error.message;
          }
        }

        async function loadStudents() {
          document.getElementById('output').innerText = 'جاري تحميل الطلاب...';
          try {
            const response = await fetch('/api/students');
            const data = await response.json();
            
            let html = '<h3>🎓 اضغط على اسم الطالب لعرض شهادته:</h3>';
            data
