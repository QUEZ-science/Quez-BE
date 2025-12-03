const express = require('express');
const router = express.Router();
const { BsmOauth } = require('bsm-oauth');
const jwt = require('jsonwebtoken');
const db = require('../utils/db'); 

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

        const token = await bsmOauth.getToken(authCode);
        const resource = await bsmOauth.getResource(token);
        
        const userData = resource.student 
            ? { // 학생 계정
                bsm_id: `${resource.student.grade}${resource.student.classNo}${resource.student.name}`, // 식별자
                username: resource.student.name,
                email: resource.email,
                grade: resource.student.grade,
                classNo: resource.student.classNo,
                role: resource.role
              }
            : { // 선생님 계정 또는 기타
                bsm_id: resource.id,
                username: resource.name,
                email: resource.email,
                grade: 0, // 0으로 설정하거나 null 처리
                classNo: 0,
                role: resource.role
              };

        // ⭐️⭐️⭐️ [핵심] DB 저장/업데이트 로직 ⭐️⭐️⭐️
        const [result] = await db.execute(
            `INSERT INTO User (bsm_id, username, email, grade, classNo, role) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                username = VALUES(username), 
                email = VALUES(email),
                grade = VALUES(grade),
                classNo = VALUES(classNo),
                role = VALUES(role)`,
            [
                userData.bsm_id, 
                userData.username, 
                userData.email, 
                userData.grade, 
                userData.classNo, 
                userData.role
            ]
        );
        
        console.log(`🔥 로그인 성공! DB 저장 완료 (ID: ${userData.bsm_id})`); 

        // 3. JWT 토큰 발급
        const myToken = jwt.sign(
            { 
                userIdentifier: userData.bsm_id, 
                nickname: userData.username,
                role: userData.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

        // 4. 성공 응답
        res.status(200).json({
            message: "로그인 및 사용자 정보 저장 성공!",
            token: myToken,
            user: {
                name: userData.username,
                grade: userData.grade,
                classNo: userData.classNo,
                role: userData.role
            }
        });

    } catch (error) {
        console.error("BSM 인증 또는 DB 저장 실패:", error);
        res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
});

module.exports = router;