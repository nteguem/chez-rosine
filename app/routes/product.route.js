const express = require('express');
const router = express.Router();
const productHandler = require('../controllers/product.controller');

/**
 * Set up the product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 * @param {string} client - The client WhatsApp.
 */
const setupProductRoutes = (app, client) => {
    // Mount the 'router' to handle routes with the base path '/product'.
    app.use("/product", router);

    // Route to get all products
    router.get('/list', (req, res) => {
        productHandler.listProducts(req, res, client);
    });

    // Route to create a new product
    router.post('/add', (req, res) => {
        productHandler.createProduct(req, res, client);
    });

    // Route to update a product
    router.put('/update/:productId', (req, res) => {
        productHandler.updateProduct(req, res, client);
    });

    // Route to delete a product
    router.delete('/delete/:productId', (req, res) => {
        productHandler.deleteProduct(req, res, client);
    });

    // Route to get a single product by its ID
    router.get('/:productId', (req, res) => {
        productHandler.getProductById(req, res, client);
    });
};

module.exports = { setupProductRoutes };
