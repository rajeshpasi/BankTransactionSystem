const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactionController = require('../controller/transaction.controller');


const transactionRoutes = express.Router();

/** * @route POST /api/transactions
 * @desc Create a new transaction between two accounts
 * @access Protected Route
 * @access Private
 */
transactionRoutes.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;