const express = require('express');
const router = express.Router();
const { BsmOauth } = require('bsm-oauth'); // bsm-oauth 불러오기
const jwt = require('jsonwebtoken');

// .env 파일에서 키 가져오기 (꼭 .env에 설정되어 있어야 해요!)
const bsmOauth = new BsmOauth(
    process.env.BSM_CLIENT_ID, 
    process.env.BSM_CLIENT_SECRET
);

/**
 * @route GET /api/auth/oauth
 * @desc BSM 인증 후 콜백 처리 & 자체 JWT 발급
 */
router.get('/oauth', async (req, res) => {
  try {
    // 1. 프론트엔드에서 넘겨준 인증 코드(code) 받기
    const authCode = req.query.code;

    if (!authCode) {
      return res.status(400).json({ message: "인증 코드가 없습니다." });
    }

    // 2. BSM 서버와 통신하여 유저 정보 가져오기
    const token = await bsmOauth.getToken(authCode);       // 인증 코드로 토큰 교환
    const resource = await bsmOauth.getResource(token);    // 토큰으로 유저 정보 조회

    // 3. 우리 서비스 전용 JWT 토큰 생성
    // (resource 안에는 userCode(학번), nickname(이름) 등이 들어있습니다)
    const payload = {
      user: {
        userCode: resource.userCode,
        nickname: resource.nickname,
        enrolledAt: resource.enrolledAt // 입학년도 등 필요 정보 추가
      }
    };

    const myServiceToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '3h' } // 로그인 유지 시간 (예: 3시간)
    );

    // 4. 로그인 성공 응답
    console.log(`로그인 성공: ${resource.nickname} (${resource.userCode})`);
    
    res.json({
      message: 'BSM Login successful',
      token: myServiceToken, // 프론트엔드는 이 토큰을 저장해서 사용
      userInfo: resource     // 유저 정보도 같이 보내주면 화면에 띄우기 좋음
    });

  } catch (err) {
    console.error("BSM OAuth Error:", err);
    res.status(500).json({ message: 'BSM 인증 중 오류가 발생했습니다.' });
  }
});

module.exports = router;