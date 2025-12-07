const express = require("express");
const router = express.Router();
const { execute } = require("../utils/db");
const checkAuth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// 모든 세션 기반 퀴즈 API는 로그인 필요
router.use(checkAuth);

/* 1) 퀴즈 세션 시작  POST /api/quiz/start= */
router.post("/start", async (req, res) => {
    try {
        const userId = req.user.userIdentifier;

        // NORMAL 문제 10개 랜덤 선택
        const [questions] = await execute(`
            SELECT id, correct_answer
            FROM Quiz
            WHERE type='NORMAL'
            ORDER BY RAND()
            LIMIT 10
        `);

        if (questions.length < 10) {
            return res.status(400).json({
                success: false,
                message: "NORMAL 문제가 10개 이상 필요합니다."
            });
        }

        // 문제 ID 배열만 저장
        const questionIds = questions.map(q => q.id);

        const sessionId = uuidv4();

        // 세션 저장
        await execute(
            `
            INSERT INTO QuizSession (id, user_id, questions)
            VALUES (?, ?, ?)
            `,
            [sessionId, userId, JSON.stringify(questionIds)]
        );

        return res.json({
            success: true,
            sessionId,
            nextCursor: "q1",
            totalQuestions: 10
        });

    } catch (error) {
        console.error("❌ 세션 생성 오류:", error);
        res.status(500).json({ success: false, message: "세션 생성 실패" });
    }
});

/* 문제 페이지네이션 제공 GET /api/quiz/question Query: sessionId, cursor, answer(optional)*/
router.get("/question", async (req, res) => {
    try {
        const { sessionId, cursor, answer } = req.query;

        if (!sessionId || !cursor) {
            return res.status(400).json({ success: false, message: "sessionId와 cursor는 필수입니다." });
        }

        // 세션 정보 조회
        const [sessionRows] = await execute(
            `SELECT * FROM QuizSession WHERE id = ?`,
            [sessionId]
        );

        if (sessionRows.length === 0) {
            return res.status(404).json({ success: false, message: "세션이 존재하지 않습니다." });
        }

        const session = sessionRows[0];
        const questions = JSON.parse(session.questions);

        // cursor → 문제 index 변환
        const index = parseInt(cursor.replace("q", "")) - 1;
        if (index < 0 || index >= questions.length) {
            return res.status(400).json({ success: false, message: "잘못된 cursor 값입니다." });
        }

        // 이전 문제 답 저장 (answer 있으면)
        if (answer !== undefined) {
            const prevQuestionIndex = index - 1;
            if (prevQuestionIndex >= 0) {
                const questionId = questions[prevQuestionIndex];

                // 정답 가져오기
                const [correctRow] = await execute(
                    `SELECT correct_answer FROM Quiz WHERE id = ?`,
                    [questionId]
                );

                const correctAnswer = correctRow[0].correct_answer;
                const isCorrect = correctAnswer === answer;

                await execute(
                    `
                    INSERT INTO QuizSessionAnswer
                    (session_id, question_id, user_answer, correct_answer, is_correct)
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [sessionId, questionId, answer, correctAnswer, isCorrect]
                );
            }
        }

        // 현재 문제 ID
        const questionId = questions[index];

        // 문제 데이터 가져오기
        const [quizRows] = await execute(
            `
            SELECT id, question, options
            FROM Quiz
            WHERE id = ?
            `,
            [questionId]
        );

        const quiz = quizRows[0];

        const isLast = index === questions.length - 1;

        return res.json({
            success: true,
            questionId: quiz.id,
            question: quiz.question,
            options: quiz.options,
            nextCursor: isLast ? null : `q${index + 2}`,
            isEnd: isLast
        });

    } catch (error) {
        console.error("❌ 문제 조회 오류:", error);
        res.status(500).json({ success: false, message: "문제 조회 실패" });
    }
});

/* 3) 결과 조회 GET /api/quiz/result Query: sessionId, lastAnswer  */
router.get("/result", async (req, res) => {
    try {
        const { sessionId, lastAnswer } = req.query;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "sessionId 필요" });
        }

        // 세션 조회
        const [sessionRows] = await execute(
            `SELECT * FROM QuizSession WHERE id = ?`,
            [sessionId]
        );

        if (sessionRows.length === 0) {
            return res.status(404).json({ success: false, message: "세션 없음" });
        }

        const session = sessionRows[0];
        const questions = JSON.parse(session.questions);

        // 마지막 문제 답도 저장해야 함
        if (lastAnswer) {
            const lastQuestionId = questions[questions.length - 1];

            const [correctRow] = await execute(
                `SELECT correct_answer FROM Quiz WHERE id = ?`,
                [lastQuestionId]
            );

            const correctAnswer = correctRow[0].correct_answer;
            const isCorrect = correctAnswer === lastAnswer;

            await execute(
                `
                INSERT INTO QuizSessionAnswer
                (session_id, question_id, user_answer, correct_answer, is_correct)
                VALUES (?, ?, ?, ?, ?)
                `,
                [sessionId, lastQuestionId, lastAnswer, correctAnswer, isCorrect]
            );
        }

        // 모든 답안 조회
        const [answers] = await execute(
            `SELECT * FROM QuizSessionAnswer WHERE session_id = ?`,
            [sessionId]
        );

        const correctCount = answers.filter(a => a.is_correct).length;
        const wrongCount = answers.length - correctCount;

        return res.json({
            success: true,
            score: correctCount,
            correctCount,
            wrongCount,
            detail: answers.map(a => ({
                questionId: a.question_id,
                userAnswer: a.user_answer,
                correctAnswer: a.correct_answer,
                correct: a.is_correct
            }))
        });

    } catch (error) {
        console.error("❌ 결과 조회 오류:", error);
        res.status(500).json({ success: false, message: "결과 조회 실패" });
    }
});


module.exports = router;
