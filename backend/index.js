// ⭐️⭐️⭐️ 이 한 줄을 맨 위에 추가하세요 ⭐️⭐️⭐️
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const app = express();

const PORT = process.env.PORT || 3000; // 이제 PORT 변수가 읽힙니다.
const authRoutes = require('./routes/auth');

// (이하 생략 - 기존 코드 유지)

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // 쿠키나 인증 헤더 허용
}));

// 2. JSON 데이터 해석
app.use(express.json());

// 3. 라우트 등록 (경로를 '/'로 단순화)
app.use('/bsm/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});