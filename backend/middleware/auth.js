const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => { 
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : null;

    if (!token) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; 
        
        // 다음 라우터로 통과
        next(); 
    } catch (error) {
        // 토큰이 만료되었거나 시그니처가 잘못된 경우
        console.error("JWT 검증 오류:", error.message);
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// 미들웨어 함수 자체를 내보냅니다.
module.exports = authMiddleware;