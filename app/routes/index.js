// Import the 'express' module to create an instance of the router.
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const { setupUserRoutes } = require('./user.route');
const { setupProductRoutes } = require('./product.route');
const { setupOrderRoutes } = require("./order.route");
const { setupVariationRoutes } = require('./variation.route');
const { setupCategoryRoutes } = require("./category.route");
const { setupLogRoutes } = require("./log.route");
const { setupTransactionRoutes } = require("./transaction.route")
const { setupWalletRoutes } = require("./wallet.route")

/* GET home page. */
// Define a route for the home page ('/') that renders the 'index' template with the title.
router.get('/', function (req, res, next) {
  res.json({ title: 'chatbot Les bons plats' });
});

/**
 * Global middleware to secure all routes except for specified exclusions.
 * @param {Array} excludedPaths - List of routes to exclude from authentication.
 */
const globalAuthenticate = (excludedPaths = []) => {
  return (req, res, next) => {
    // Check if the current route is part of the exclusions
    if (excludedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }
    authenticateToken(req, res, next);
  };
};

/**
 * Function to set up all the app routes and connect them to their corresponding route modules.
 * @returns {express.Router} - The configured router instance.
 */
const setupAppRoutes = (client) => {
  const app = router;
  // Apply the global middleware to all routes with specified exclusions
  app.use(globalAuthenticate(['/user/login','order/notification-payment']));
  setupUserRoutes(app, client);
  setupProductRoutes(app, client);
  setupOrderRoutes(app, client);
  setupVariationRoutes(app, client);
  setupCategoryRoutes(app, client);
  setupLogRoutes(app);
  setupTransactionRoutes(app, client)
  setupWalletRoutes(app, client)
  return app;
}

module.exports = setupAppRoutes;
