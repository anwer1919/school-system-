const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const students = [
  { id: 1, name: "أحمد محمد", grade: "الصف العاشر" },
  { id: 2, name: "سارة علي", grade: "الصف الحادي عشر" }
];

app.get('/', (req, res) => {
  res.json({ message: "✅ نظام المدرسة يعمل بنجاح!" });
});

app.get('/api/students', (req, res) => {
  res.json({ success: true, data: students });
});

app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});
