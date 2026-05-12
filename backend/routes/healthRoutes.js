// ──────────────────────────────────────────────────────────
// Redis Health Check Route (Removed) — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis has been removed.
// ──────────────────────────────────────────────────────────

import express from 'express';

const router = express.Router();

router.get('/redis', async (req, res) => {
  res.json({
    success: true,
    status: 'removed',
    message: 'Redis has been removed from the system.',
    timestamp: new Date().toISOString(),
  });
});

router.get('/redis/ping', async (req, res) => {
  res.json({ success: true, pong: true, message: 'Redis removed' });
});

export default router;
