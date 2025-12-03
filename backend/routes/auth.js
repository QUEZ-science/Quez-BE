const express = require('express');
const router = express.Router();
const { BsmOauth } = require('bsm-oauth');
const jwt = require('jsonwebtoken');

const bsmOauth = new BsmOauth(
    process.env.BSM_CLIENT_ID, 
    process.env.BSM_CLIENT_SECRET
);

router.get('/oauth', async (req, res) => {
    try {
        const authCode = req.query.code; 

        if (!authCode) {
            return res.status(400).json({ message: "인증 코드가 없습니다." });
        }

        // 1. BSM에서 유저 정보 받아오기
        const token = await bsmOauth.getToken(authCode);
        const resource = await bsmOauth.getResource(token);
        
        // ⭐️⭐️⭐️ [수정] resource 객체 전체를 출력합니다. (24번째 줄) ⭐️⭐️⭐️
        console.log("🔥 BSM 유저 정보 전체:", resource);

        // 2. DB가 없으니 그냥 바로 토큰 발급 (로그인은 성공 처리)
        const myToken = jwt.sign(
            { 
                // resource.user.userCode 대신 resource.userCode 사용 또는 resource.code 사용 
                userCode: resource.userCode, // (혹시나 해서 user를 뺌)
                nickname: resource.name, // resource.user를 제거
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
                name: resource.name,
                studentId: resource.userCode 
            }
        });

    } catch (error) {
        console.error("BSM 인증 실패:", error);
        res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
});

module.exports = router;