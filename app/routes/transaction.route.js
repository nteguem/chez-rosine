const express = require('express');
const router = express.Router();
const transactionHandler = require('../controllers/transaction.controller');

/**
 * Set up the transaction routes.
 * @param {express.Application} app - The Express application.
 */
const setupTransactionRoutes = (app) => {
  app.use("/transaction", router);

  router.get('/list', (req, res) => transactionHandler.listTransactions(req, res));
  router.post('/create', (req, res) => transactionHandler.createTransaction(req, res));
  router.put('/update/:transactionId', (req, res) => transactionHandler.updateTransaction(req, res));
  router.delete('/delete/:transactionId', (req, res) => transactionHandler.deleteTransaction(req, res));
  router.get('/:transactionId', (req, res) => transactionHandler.getTransactionById(req, res));
};

module.exports = { setupTransactionRoutes };
