require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 통신 허용 패키지
const app = express();

const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth'); // 인증 라우터 연결

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // 쿠키나 인증 헤더 허용
}));

// 2. JSON 데이터 해석
app.use(express.json());

// 3. 라우트 등록
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});