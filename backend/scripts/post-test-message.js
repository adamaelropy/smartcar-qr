require('dotenv').config();
const http = require('http');

const data = JSON.stringify({ type: 'MESSAGE', message: 'Test from node script' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/qr/e83df747f1752183d11c2414b4d5604b227f84f61fcdd52b9f782e119e3d0351/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (err) => console.error('Request error:', err.message));
req.write(data);
req.end();
