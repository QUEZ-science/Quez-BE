require('dotenv').config(); // 환경 변수 로드
const express = require('express');
const app = express();

const authRoutes = require('./routes/auth'); // 위에서 수정한 파일 연결
const PORT = process.env.PORT || 3000;

app.use(express.json()); 

// 라우트 연결
app.use('/api/auth', authRoutes);
// 나중에 만들 user 라우트도 있으면 여기에 추가
// app.use('/api/user', require('./routes/user')); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});