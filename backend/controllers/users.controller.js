const prisma = require('../db');

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        vehicle: {
          select: {
            qr_token: true,
          },
        },
      },
      orderBy: { username: 'asc' },
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
}

module.exports = { listUsers };
