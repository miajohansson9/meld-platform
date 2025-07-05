const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { CompassView, WinsView } = require('~/models');

const router = express.Router();
router.use(requireJwtAuth);

// GET /api/views/compass?date=YYYY-MM-DD
router.get('/compass', async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const query = { user: userId };
    if (date) query.date = date;
    const views = await CompassView.find(query).sort({ date: -1 }).lean();
    res.status(200).json(views);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/views/wins?date=YYYY-MM-DD
router.get('/wins', async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const query = { user: userId };
    if (date) query.achievedAt = date;
    const views = await WinsView.find(query).sort({ achievedAt: -1 }).lean();
    res.status(200).json(views);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 