const express = require('express');
const router = express.Router();
const { generateItinerary } = require('../controllers/itineraryController');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Travel Planner API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.post('/generate-plan', generateItinerary);

module.exports = router;
