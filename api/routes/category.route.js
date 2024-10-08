const express = require('express');
const router = express.Router();
const categoryHandler = require('../controllers/category.controller');

/**
 * Set up the category routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 * @param {string} client - The client WhatsApp.
 */
const setupCategoryRoutes = (app, client) => {
    // Mount the 'router' to handle routes with the base path '/category'.
    app.use("/category", router);

    // Route to list all categories
    router.get('/list', (req, res) => {
        categoryHandler.listCategories(req, res, client);
    });

    // Route to create a new category
    router.post('/create', (req, res) => {
        categoryHandler.createCategory(req, res, client);
    });

    // Route to update a category
    router.put('/update/:categoryId', (req, res) => {
        categoryHandler.updateCategory(req, res, client);
    });

    // Route to delete a category
    router.delete('/delete/:categoryId', (req, res) => {
        categoryHandler.deleteCategory(req, res, client);
    });

    // Route to get a single category by its ID
    router.get('/:categoryId', (req, res) => {
        categoryHandler.getCategoryById(req, res, client);
    });
};

module.exports = { setupCategoryRoutes };
