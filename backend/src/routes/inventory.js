const express = require('express');
const fifoService = require('../services/fifoService');
const { producer, TOPIC } = require('../config/kafka');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get inventory status
router.get('/status', async (req, res) => {
  try {
    const inventory = await fifoService.getInventoryStatus();
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get transaction ledger
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await fifoService.getTransactionLedger(limit, offset);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Simulate events (push to Kafka)
router.post('/simulate', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array required' });
    }

    // Connect producer if not connected
    if (!producer.connect) {
      await producer.connect();
    }

    // Send events to Kafka
    const messages = events.map(event => ({
      value: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      })
    }));

    await producer.send({
      topic: TOPIC,
      messages
    });

    res.json({ 
      success: true, 
      message: `${events.length} events sent to Kafka`,
      count: events.length 
    });
  } catch (error) {
    console.error('Error simulating events:', error);
    res.status(500).json({ error: 'Failed to simulate events' });
  }
});

module.exports = router;