const { Kafka } = require('kafkajs');

const isProduction = process.env.NODE_ENV === 'production';

console.log('📨 Kafka Config Loading...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('KAFKA_BROKERS:', process.env.KAFKA_BROKERS);
console.log('Production mode:', isProduction);

// Base Kafka config
const kafkaConfig = {
  clientId: 'flowstock-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map(b => b.trim()),
  retry: {
    initialRetryTime: 300,
    retries: 10
  },
  requestTimeout: 25000,  // Important for cloud Kafka
  connectionTimeout: 10000
};

// Add authentication for production (Upstash)
if (isProduction && process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  kafkaConfig.sasl = {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  };
  kafkaConfig.ssl = true;
  console.log('✅ Kafka authentication configured (SASL/SCRAM-SHA-256)');
} else if (!isProduction) {
  console.log('ℹ️  Local Kafka (no auth)');
} else {
  console.warn('⚠️  Production mode but no Kafka credentials provided');
}

console.log('🔧 Final Kafka Config:', {
  brokers: kafkaConfig.brokers,
  hasAuth: !!kafkaConfig.sasl,
  ssl: kafkaConfig.ssl || false
});

const kafka = new Kafka(kafkaConfig);

const producer = kafka.producer({
  idempotent: true,  // Important for exactly-once semantics
  transactionTimeout: 30000
});

const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'flowstock-consumer',
  sessionTimeout: 30000,
  rebalanceTimeout: 60000
});

const TOPIC = process.env.KAFKA_TOPIC || 'inventory-events';

const initKafka = async () => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    
    console.log('🔗 Admin connected');
    
    // List existing topics
    const topics = await admin.listTopics();
    console.log('📋 Existing topics:', topics);
    
    if (!topics.includes(TOPIC)) {
      console.log(`📝 Creating topic: ${TOPIC}`);
      await admin.createTopics({
        topics: [{
          topic: TOPIC,
          numPartitions: 1,
          replicationFactor: 1
        }]
      });
      console.log(`✅ Kafka topic '${TOPIC}' created`);
    } else {
      console.log(`✅ Kafka topic '${TOPIC}' already exists`);
    }
    
    await admin.disconnect();
  } catch (error) {
    console.error('❌ Error initializing Kafka:', error.message);
    throw error;
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  TOPIC,
  initKafka
};