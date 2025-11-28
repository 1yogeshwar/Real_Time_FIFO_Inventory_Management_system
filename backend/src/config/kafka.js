const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'flowstock-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'flowstock-consumer' 
});

const TOPIC = process.env.KAFKA_TOPIC || 'inventory-events';

const initKafka = async () => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    
    // Create topic if doesn't exist
    const topics = await admin.listTopics();
    if (!topics.includes(TOPIC)) {
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
    console.error('❌ Error initializing Kafka:', error);
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