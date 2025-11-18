require('dotenv').config();

const express = require('express');
const app = express();

const clientId = '16d7ce96'; // 클라이언트 ID
const clientSecret = '7bb3bf46bef1ee2ed58047d5e2fe7aa7'; // 클라이언트 시크릿
const { BsmOauth } = require('bsm-oauth');
const bsmOauth = new BsmOauth(clientId, clientSecret);

app.get('/oauth', async (req, res) => {
  const authCode = req.query.code;

  // 임시 인증코드를 유저 토큰으로 교환
  // 유저 토큰은 유저마다 고유하기에 따로 보관하여 일정시간마다 유저의 정보를 갱신하는 용도로도 사용할 수 있습니다
  const token = await bsmOauth.getToken(authCode);
  const resource = await bsmOauth.getResource(token);

  console.log(resource);
});

app.listen(3000);