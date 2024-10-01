const express = require('express');
const router = express.Router();
const subscriptionHandler = require('../controllers/subscription.controller');

/**
 * Set up the subscription routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupSubscription = (app,client) => {
  // Mount the 'router' to handle routes with the base path '/subscription'.
  app.use("/subscription", router);
  
  router.post('/notification-payment', (req, res) => {
    subscriptionHandler.handlePaymentMonetbilNotification(req, res,client);
  });

};

module.exports = { setupSubscription };
