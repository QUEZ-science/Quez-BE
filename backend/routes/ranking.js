const express = require("express");
const router = express.Router();
const db = require("../utils/db");  // structure: db.execute()

// ⭐ 상위 10명 랭킹
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.username,
        r.score
      FROM UserRank r
      JOIN User u ON r.user_id = u.id
      ORDER BY r.score DESC
      LIMIT 10
    `;

    console.log("🔥 실행되는 SQL:", query);

    const [rows] = await db.execute(query);

    res.json({
      success: true,
      ranking: rows,
    });
  } catch (error) {
    console.error("🚨 랭킹 조회 SQL 오류 발생:");
    console.error(error);  // 상세 로그
    res.status(500).json({
      success: false,
      message: "랭킹 불러오기 오류",
      error: error.message,
    });
  }
});

// ⭐ 점수 저장
router.post("/", async (req, res) => {
  try {
    const { user_id, score } = req.body;

    if (!user_id || !score) {
      return res.status(400).json({
        success: false,
        message: "user_id와 score는 필수입니다.",
      });
    }

    const insertQuery = `
      INSERT INTO UserRank (user_id, score, recorded_date)
      VALUES (?, ?, CURDATE())
    `;

    console.log("🔥 INSERT SQL:", insertQuery, [user_id, score]);

    await db.execute(insertQuery, [user_id, score]);

    res.json({
      success: true,
      message: "저장됨!",
    });
  } catch (error) {
    console.error("🚨 점수 저장 오류:");
    console.error(error);
    res.status(500).json({
      success: false,
      message: "점수 저장 오류",
      error: error.message,
    });
  }
});

module.exports = router;
