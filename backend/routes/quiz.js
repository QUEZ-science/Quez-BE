const express = require('express');
const router = express.Router();
const { execute } = require('../utils/db');

/* 
DAILY QUIZ — 익명 / 하루 1문제 고정 / DB 기록 없음
*/

// ✔ 오늘의 날짜 기반으로 문제 고정
router.get('/daily', async (req, res) => {
    try {
        // 오늘 날짜 (YYYYMMDD → 숫자)
        const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const seed = parseInt(today, 10);

        // DAILY 문제 전체 가져오기
        const [quizzes] = await execute(`
            SELECT id, question, options, correct_answer
            FROM Quiz
            WHERE type = 'DAILY'
        `);

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ success: false, message: "데일리 퀴즈가 없습니다." });
        }

        // 문제 수만큼 seed % 갯수 → 오늘의 문제 고정
        const index = seed % quizzes.length;
        const todayQuiz = quizzes[index];

        // 정답 제외하고 전송
        res.status(200).json({
            success: true,
            quiz: {
                id: todayQuiz.id,
                question: todayQuiz.question,
                options: todayQuiz.options
            }
        });

    } catch (error) {
        console.error("❌ 데일리 퀴즈 로딩 오류:", error);
        res.status(500).json({ success: false, message: "데일리 퀴즈 로딩 실패" });
    }
});


// ✔ 정답 체크 — 기록 없음
router.post('/daily/submit', async (req, res) => {
    try {
        const { quizId, answer } = req.body;

        if (!quizId || !answer) {
            return res.status(400).json({ success: false, message: "quizId와 answer가 필요합니다." });
        }

        // 정답 가져오기
        const [rows] = await execute(`
            SELECT correct_answer
            FROM Quiz
            WHERE id = ?
        `, [quizId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: "퀴즈가 존재하지 않습니다." });
        }

        const correct = rows[0].correct_answer === answer;

        res.status(200).json({
            success: true,
            correct,
            message: correct ? "정답입니다!" : "틀렸습니다!"
        });

    } catch (error) {
        console.error("❌ 데일리 제출 오류:", error);
        res.status(500).json({ success: false, message: "채점 중 오류 발생" });
    }
});


module.exports = router;
