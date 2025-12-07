const mysql = require('mysql2/promise');
//.env 정보 사용
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log(`MySQL DB 연결 시도: ${process.env.DB_DATABASE}`);

module.exports = pool;