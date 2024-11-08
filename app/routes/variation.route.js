const express = require('express');
const router = express.Router();
const variationController = require('../controllers/variation.controller');

/**
 * Set up the variation routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 * @param {string} client - The client WhatsApp.
 */
const setupVariationRoutes = (app, client) => {
    // Mount the 'router' to handle routes with the base path '/variation'.
    app.use("/variation", router);

    // Route pour récupérer toutes les variations
    router.get('/list', (req, res) => {
        variationController.listVariations(req, res, client);
    });

    // Route pour créer une nouvelle variation
    router.post('/create', (req, res) => {
        variationController.createVariation(req, res, client);
    });

    // Route pour mettre à jour une variation
    router.put('/update/:variationId', (req, res) => {
        variationController.updateVariation(req, res, client);
    });

    // Route pour supprimer une variation
    router.delete('/delete/:variationId', (req, res) => {
        variationController.deleteVariation(req, res, client);
    });

    // Route pour récupérer une variation par ID
    router.get('/:variationId', (req, res) => {
        variationController.getVariationById(req, res, client);
    });
};

module.exports = { setupVariationRoutes };
