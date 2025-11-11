const { pool } = require('../config/database');

/**
 * FIFO Service - Core Business Logic
 * Handles First-In-First-Out inventory costing
 */

class FIFOService {
  /**
   * Process a purchase event
   * Creates a new inventory batch
   */
  async processPurchase(productId, quantity, unitPrice, timestamp) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Ensure product exists
      const productCheck = await client.query(
        'SELECT product_id FROM products WHERE product_id = $1',
        [productId]
      );

      if (productCheck.rows.length === 0) {
        // Create product if doesn't exist
        await client.query(
          `INSERT INTO products (product_id, name, current_quantity, total_cost)
           VALUES ($1, $2, 0, 0)`,
          [productId, `Product ${productId}`]
        );
      }

      // Create inventory batch
      const totalCost = quantity * unitPrice;
      await client.query(
        `INSERT INTO inventory_batches 
         (product_id, quantity, remaining_quantity, unit_price, total_cost, purchased_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [productId, quantity, quantity, unitPrice, totalCost, timestamp]
      );

      // Update product totals
      await client.query(
        `UPDATE products 
         SET current_quantity = current_quantity + $1,
             total_cost = total_cost + $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $3`,
        [quantity, totalCost, productId]
      );

      // Log transaction
      await client.query(
        `INSERT INTO transactions_log 
         (product_id, transaction_type, quantity, unit_price, total_cost, transaction_time)
         VALUES ($1, 'PURCHASE', $2, $3, $4, $5)`,
        [productId, quantity, unitPrice, totalCost, timestamp]
      );

      await client.query('COMMIT');
      
      console.log(`✅ Purchase processed: ${quantity} units of ${productId} @ $${unitPrice}`);
      
      return {
        success: true,
        productId,
        quantity,
        unitPrice,
        totalCost
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing purchase:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a sale event using FIFO
   * Consumes oldest batches first
   */
  async processSale(productId, quantityToSell, timestamp) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if product exists
      const productResult = await client.query(
        'SELECT current_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${productId} not found`);
      }

      const currentQuantity = productResult.rows[0].current_quantity;
      
      if (currentQuantity < quantityToSell) {
        throw new Error(
          `Insufficient inventory for ${productId}. Available: ${currentQuantity}, Requested: ${quantityToSell}`
        );
      }

      // Get oldest batches (FIFO)
      const batchesResult = await client.query(
        `SELECT id, remaining_quantity, unit_price 
         FROM inventory_batches 
         WHERE product_id = $1 AND remaining_quantity > 0
         ORDER BY purchased_at ASC`,
        [productId]
      );

      const batches = batchesResult.rows;
      let remainingToSell = quantityToSell;
      let totalCost = 0;
      const consumedBatches = [];

      // Consume batches using FIFO
      for (const batch of batches) {
        if (remainingToSell <= 0) break;

        const quantityFromBatch = Math.min(batch.remaining_quantity, remainingToSell);
        const costFromBatch = quantityFromBatch * batch.unit_price;

        consumedBatches.push({
          batchId: batch.id,
          quantity: quantityFromBatch,
          unitPrice: batch.unit_price,
          cost: costFromBatch
        });

        totalCost += costFromBatch;
        remainingToSell -= quantityFromBatch;

        // Update batch remaining quantity
        await client.query(
          `UPDATE inventory_batches 
           SET remaining_quantity = remaining_quantity - $1
           WHERE id = $2`,
          [quantityFromBatch, batch.id]
        );
      }

      const averageCost = totalCost / quantityToSell;

      // Create sale record
      const saleResult = await client.query(
        `INSERT INTO sales 
         (product_id, quantity_sold, total_cost, average_cost, sold_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [productId, quantityToSell, totalCost, averageCost, timestamp]
      );

      const saleId = saleResult.rows[0].id;

      // Record which batches were consumed
      for (const batch of consumedBatches) {
        await client.query(
          `INSERT INTO sale_batch_details 
           (sale_id, batch_id, quantity_from_batch, unit_price, cost_from_batch)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, batch.batchId, batch.quantity, batch.unitPrice, batch.cost]
        );
      }

      // Update product totals
      await client.query(
        `UPDATE products 
         SET current_quantity = current_quantity - $1,
             total_cost = total_cost - $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $3`,
        [quantityToSell, totalCost, productId]
      );

      // Log transaction
      await client.query(
        `INSERT INTO transactions_log 
         (product_id, transaction_type, quantity, unit_price, total_cost, transaction_time)
         VALUES ($1, 'SALE', $2, $3, $4, $5)`,
        [productId, quantityToSell, averageCost, totalCost, timestamp]
      );

      await client.query('COMMIT');
      
      console.log(`✅ Sale processed: ${quantityToSell} units of ${productId} @ avg $${averageCost.toFixed(2)}`);
      
      return {
        success: true,
        productId,
        quantitySold: quantityToSell,
        totalCost,
        averageCost,
        batchesConsumed: consumedBatches
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing sale:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current inventory status for all products
   */
  async getInventoryStatus() {
    try {
      const result = await pool.query(`
        SELECT 
          p.product_id,
          p.name,
          p.current_quantity,
          p.total_cost,
          CASE 
            WHEN p.current_quantity > 0 THEN p.total_cost / p.current_quantity 
            ELSE 0 
          END as average_cost_per_unit,
          p.updated_at
        FROM products p
        ORDER BY p.product_id
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting inventory status:', error);
      throw error;
    }
  }

  /**
   * Get transaction ledger with pagination
   */
  async getTransactionLedger(limit = 50, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          product_id,
          transaction_type,
          quantity,
          unit_price,
          total_cost,
          transaction_time,
          created_at
        FROM transactions_log
        ORDER BY transaction_time DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting transaction ledger:', error);
      throw error;
    }
  }
}

module.exports = new FIFOService();
