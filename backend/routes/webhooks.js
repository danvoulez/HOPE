const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * MongoDB Webhook Handler
 * 
 * This endpoint receives webhook notifications from MongoDB Atlas
 * for database events like inserts, updates, deletes, etc.
 * 
 * If a webhook secret is configured, it verifies the signature
 * to ensure the request is legitimate.
 */
router.post('/mongodb', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MONGODB_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const signature = req.headers['x-mongodb-signature'];
      
      if (!signature) {
        console.error('MongoDB webhook signature missing');
        return res.status(401).json({ error: 'Signature missing' });
      }
      
      // Create expected signature
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(req.body);
      const expectedSignature = hmac.digest('hex');
      
      // Compare signatures
      if (signature !== expectedSignature) {
        console.error('MongoDB webhook signature invalid');
        return res.status(401).json({ error: 'Signature invalid' });
      }
    }
    
    // Parse the raw body
    const payload = JSON.parse(req.body.toString());
    
    // Log the webhook event
    console.log('MongoDB webhook received:', {
      operationType: payload.operationType,
      namespace: payload.ns,
      timestamp: payload.clusterTime ? new Date(payload.clusterTime.$timestamp.t * 1000) : new Date(),
    });
    
    // Process different operation types
    switch (payload.operationType) {
      case 'insert':
        // Handle insert operations
        console.log('Document inserted:', payload.fullDocument);
        break;
      case 'update':
        // Handle update operations
        console.log('Document updated:', payload.documentKey, payload.updateDescription);
        break;
      case 'delete':
        // Handle delete operations
        console.log('Document deleted:', payload.documentKey);
        break;
      case 'replace':
        // Handle replace operations
        console.log('Document replaced:', payload.documentKey);
        break;
      default:
        console.log('Other operation type:', payload.operationType);
    }
    
    // Acknowledge receipt of the webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing MongoDB webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
