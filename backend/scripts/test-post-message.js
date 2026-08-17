require('dotenv').config();

(async () => {
  const token = 'e83df747f1752183d11c2414b4d5604b227f84f61fcdd52b9f782e119e3d0351';
  try {
    const res = await fetch(`http://localhost:3000/api/qr/${encodeURIComponent(token)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'MESSAGE', message: 'Test message from script', from: 'script:tester' }),
    });
    const data = await res.json().catch(() => null);
    console.log('status', res.status, 'body', data);
  } catch (e) {
    console.error('error', e.message);
  }
})();