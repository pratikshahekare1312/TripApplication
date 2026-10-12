const express = require('express');
const router = express.Router();
const { generateItinerary } = require('../controllers/itineraryController');

router.post('/generate-plan', generateItinerary);

module.exports = router;