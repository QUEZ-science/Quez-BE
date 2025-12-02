const express = require('express');
const router = express.Router();
const { BsmOauth } = require('bsm-oauth');
const jwt = require('jsonwebtoken');

const bsmOauth = new BsmOauth(
    process.env.BSM_CLIENT_ID, 
    process.env.BSM_CLIENT_SECRET
);

// POST /api/auth/oauth
router.post('/oauth', async (req, res) => {
    try {
        const authCode = req.body.code;

        if (!authCode) {
            return res.status(400).json({ message: "인증 코드가 없습니다." });
        }

        // 1. BSM에서 유저 정보 받아오기
        const token = await bsmOauth.getToken(authCode);
        const resource = await bsmOauth.getResource(token);
        
        console.log("🔥 로그인 시도한 유저:", resource.nickname);

        // 2. DB가 없으니 그냥 바로 토큰 발급 (로그인은 성공 처리)
        const myToken = jwt.sign(
            { 
                userCode: resource.userCode,
                nickname: resource.nickname,
                role: resource.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

        // 3. 성공 응답
        res.status(200).json({
            message: "로그인 성공 (DB 미연결 상태)",
            token: myToken,
            user: {
                name: resource.nickname,
                studentId: resource.userCode
            }
        });

    } catch (error) {
        console.error("BSM 인증 실패:", error);
        res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
});

module.exports = router;