// MUST BE FIRST - Load environment variables
const path = require('path');
const env = process.env.NODE_ENV || 'development';

// Load appropriate .env file
if (env === 'production') {
  console.log('📍 Loading production environment...');
  require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
} else {
  console.log('📍 Loading development environment...');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Verify critical env vars are loaded
console.log('\n🔍 Environment Variables Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('   PORT:', process.env.PORT || 'NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : 'Using individual DB vars');
console.log('   KAFKA_BROKERS:', process.env.KAFKA_BROKERS || 'NOT SET');

if (!process.env.JWT_SECRET) {
  console.error('\n❌ CRITICAL ERROR: JWT_SECRET is not set!');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const { initKafka, producer } = require('./config/kafka');
const kafkaConsumer = require('./services/kafkaConsumer');

// Routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'FlowStock API',
    environment: process.env.NODE_ENV,
    env: {
      jwtConfigured: !!process.env.JWT_SECRET,
      dbConfigured: !!process.env.DATABASE_URL || !!process.env.DB_HOST,
      kafkaConfigured: !!process.env.KAFKA_BROKERS
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting FlowStock Server...\n');

    // Initialize database
    console.log('📊 Initializing database...');
    await initDatabase();

    // Initialize Kafka
    console.log('\n📨 Initializing Kafka...');
    await initKafka();
    await producer.connect();
    console.log('✅ Kafka producer connected');

    // Start Kafka consumer
    console.log('\n🎧 Starting Kafka consumer...');
    await kafkaConsumer.start();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ FlowStock API server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`\n🎯 Default credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await kafkaConsumer.stop();
    await producer.disconnect();
    console.log('✅ Kafka connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();