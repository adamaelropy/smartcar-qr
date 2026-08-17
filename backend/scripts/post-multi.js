require('dotenv').config();
(async () => {
  const token = 'e83df747f1752183d11c2414b4d5604b227f84f61fcdd52b9f782e119e3d0351';
  const froms = ['visitor:alice','visitor:bob'];
  for (const from of froms) {
    try {
      const res = await fetch(`http://localhost:3000/api/qr/${token}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MESSAGE', message: 'hi from ' + from, from })
      });
      console.log('posted', from, await res.json());
    } catch (e) { console.error('err', e.message); }
  }
})();