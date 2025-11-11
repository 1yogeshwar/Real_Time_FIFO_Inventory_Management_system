const { consumer, TOPIC } = require('../config/kafka');
const fifoService = require('./fifoService');

class KafkaConsumerService {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    try {
      await consumer.connect();
      console.log('✅ Kafka consumer connected');

      await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
      console.log(`✅ Subscribed to topic: ${TOPIC}`);

      this.isRunning = true;

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log('\n📥 Received event:', event);

            await this.processEvent(event);
          } catch (error) {
            console.error('❌ Error processing message:', error);
          }
        },
      });
    } catch (error) {
      console.error('❌ Error starting Kafka consumer:', error);
      throw error;
    }
  }

  async processEvent(event) {
    const { product_id, event_type, quantity, unit_price, timestamp } = event;

    // Validate event
    if (!product_id || !event_type || !quantity || !timestamp) {
      console.error('❌ Invalid event format:', event);
      return;
    }

    const eventTime = new Date(timestamp);

    try {
      if (event_type === 'purchase') {
        if (!unit_price) {
          console.error('❌ Purchase event missing unit_price');
          return;
        }
        await fifoService.processPurchase(product_id, quantity, unit_price, eventTime);
      } else if (event_type === 'sale') {
        await fifoService.processSale(product_id, quantity, eventTime);
      } else {
        console.error('❌ Unknown event type:', event_type);
      }
    } catch (error) {
      console.error(`❌ Error processing ${event_type} event:`, error.message);
    }
  }

  async stop() {
    if (this.isRunning) {
      await consumer.disconnect();
      this.isRunning = false;
      console.log('✅ Kafka consumer disconnected');
    }
  }
}

module.exports = new KafkaConsumerService();