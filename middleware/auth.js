const jwt = require('jsonwebtoken');

exports.checkAuth = (req, res, next) => {
    // 1. 헤더에서 토큰 꺼내기 (Authorization: Bearer <토큰>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        // 2. 토큰 검증
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // 요청에 유저 정보 붙여주기
        next(); // 통과!
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};