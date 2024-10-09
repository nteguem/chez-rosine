const express = require('express');
const router = express.Router();
const orderHandler = require('../controllers/order.controller');

/**
 * Set up the order routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 * @param {string} client - The client (e.g., WhatsApp or external system).
 */
const setupOrderRoutes = (app, client) => {
    app.use("/order", router);

    // Récupérer les commandes d'un client spécifique
    router.get('/customer/:customerId', (req, res) => {
        orderHandler.getOrdersByCustomer(req, res, client);
    });

    // Récupérer les commandes d'un livreur spécifique
    router.get('/delivery/:deliveryPersonId', (req, res) => {
        orderHandler.getOrdersByDeliveryPerson(req, res, client);
    });

    // Créer une nouvelle commande
    router.post('/create', (req, res) => {
        orderHandler.createOrder(req, res, client);
    });

    // Mettre à jour le statut de livraison
    router.put('/update-status', (req, res) => {
        orderHandler.updateDeliveryStatus(req, res, client);
    });

    router.post('/notification-payment', (req, res) => {
        orderHandler.handlePaymentMonetbilNotification(req, res,client);
      });
};

module.exports = { setupOrderRoutes };