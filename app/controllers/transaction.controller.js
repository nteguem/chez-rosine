const transactionService = require('../services/transaction.service');
const ResponseService = require('../services/response.service');

const createTransaction = async (req, res) => {
  const transactionData = req.body;
  const response = await transactionService.createTransaction(transactionData);
  if (response.success) {
    return ResponseService.success(res, { transaction: response.transaction, message: response.message });
  } else {
    return ResponseService.internalServerError(res, { error: response.message });
  }
};

const updateTransaction = async (req, res) => {
  const transactionId = req.params.transactionId;
  const updatedData = req.body;
  const response = await transactionService.updateTransaction(transactionId, updatedData);
  if (response.success) {
    return ResponseService.success(res, { transaction: response.transaction, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

const deleteTransaction = async (req, res) => {
  const transactionId = req.params.transactionId;
  const response = await transactionService.deleteTransaction(transactionId);
  if (response.success) {
    return ResponseService.success(res, { transaction: response.transaction, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

const listTransactions = async (req, res) => {
  const { limit, offset } = req.query;
  const response = await transactionService.listTransactions(limit, offset);
  if (response.success) {
    return ResponseService.success(res, { transactions: response.transactions, total: response.total });
  } else {
    return ResponseService.internalServerError(res, { error: response.message });
  }
};

const getTransactionById = async (req, res) => {
  const transactionId = req.params.transactionId;
  const response = await transactionService.getTransactionById(transactionId);
  if (response.success) {
    return ResponseService.success(res, { transaction: response.transaction });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

module.exports = {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listTransactions,
  getTransactionById,
};
