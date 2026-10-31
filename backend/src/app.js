const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const itineraryRoutes = require('./routes/itineraryRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Travel Planner API is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Travel Planner API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total_places FROM places');
    res.json({ status: 'success', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/test-matching', async (req, res) => {
  try {
    const { matchPlaces } = require('./services/matchingService');
    const [places] = await pool.query('SELECT * FROM places LIMIT 10');

    const userPrefs = {
      vibe: 'chill',
      budget: 'mid',
      crowd: 'low',
      wantsAdventureSports: false,
      wantsWaterActivities: true,
      wantsTrekking: false,
      wantsNightlife: false,
      wantsShopping: false,
      wantsPhotography: true
    };

    const result = await matchPlaces(userPrefs, places);
    res.json({ status: 'success', top5: result.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/test-knapsack', async (req, res) => {
  try {
    const { matchPlaces } = require('./services/matchingService');
    const { knapsack } = require('./services/knapsackService');
    const [places] = await pool.query('SELECT * FROM places LIMIT 20');

    const userPrefs = {
      vibe: 'chill',
      budget: 'mid',
      crowd: 'low',
      wantsAdventureSports: false,
      wantsWaterActivities: true,
      wantsTrekking: false,
      wantsNightlife: false,
      wantsShopping: false,
      wantsPhotography: true
    };

    const matched = await matchPlaces(userPrefs, places);
    const selected = knapsack(matched, 3, 'mid');
    res.json({ status: 'success', selected_places: selected.length, places: selected });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/test-route', async (req, res) => {
  try {
    const { matchPlaces } = require('./services/matchingService');
    const { knapsack } = require('./services/knapsackService');
    const { buildRoute, calculateCost } = require('./services/routeService');
    const [places] = await pool.query('SELECT * FROM places LIMIT 20');

    const userPrefs = {
      vibe: 'chill',
      budget: 'mid',
      crowd: 'low',
      wantsAdventureSports: false,
      wantsWaterActivities: true,
      wantsTrekking: false,
      wantsNightlife: false,
      wantsShopping: false,
      wantsPhotography: true
    };

    const matched = await matchPlaces(userPrefs, places);
    const selected = knapsack(matched, 3, 'mid');
    const itinerary = buildRoute(selected, 3);
    const cost = calculateCost(selected, 3, 'mid');
    res.json({ status: 'success', cost, itinerary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Main API route
app.use('/api', itineraryRoutes);

// Fallback route for unmatched endpoints
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong'
  });
});

module.exports = app;
