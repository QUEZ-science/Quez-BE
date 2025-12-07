// ⭐️⭐️⭐️ 이 한 줄을 맨 위에 추가하세요 ⭐️⭐️⭐️
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const app = express();

const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
// ⭐️ [추가] 퀴즈 라우터 연결
const quizRoutes = require('./routes/quiz'); 

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // 쿠키나 인증 헤더 허용
}));

// 2. JSON 데이터 해석
app.use(express.json());

// 3. 라우트 등록
app.use('/bsm/auth', authRoutes); // BSM 인증 경로는 '/bsm/auth/oauth'
app.use('/api/quiz', quizRoutes); // ⭐️ [추가] 보호된 퀴즈 경로
app.use('/api/ranking', require('./routes/ranking'));


app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});