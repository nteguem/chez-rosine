// Import the 'express' module to create an instance of the router.
const express = require('express');
const router = express.Router();
const { setupUserRoutes } = require('./user.route');
const {setupProductRoutes} = require('./product.route');
const {setupOrderRoutes} = require("./order.route");
const {setupVariationRoutes} = require('./variation.route');
const {setupCategoryRoutes} = require("./category.route");
const {setupLogRoutes} = require("./log.route")
/* GET home page. */
// Define a route for the home page ('/') that renders the 'index' template with the title 'Bibemella'.
router.get('/', function(req, res, next) {
  res.json({ title: 'chatbot Les bons plats' });
});

/**
 * Function to set up all the app routes and connect them to their corresponding route modules.
 * @returns {express.Router} - The configured router instance.
 */
const setupAppRoutes = (client) => {
  const app = router;
  setupUserRoutes(app,client);
  setupProductRoutes(app,client);
  setupOrderRoutes(app,client);
  setupVariationRoutes(app,client);
  setupCategoryRoutes(app,client);
  setupLogRoutes(app);
  return app;
}

module.exports = setupAppRoutes;
