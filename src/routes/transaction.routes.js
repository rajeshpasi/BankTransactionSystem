const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactionController = require('../controller/transaction.controller');


const router = express.Router();

/** * @route POST /api/transactions
 * @desc Create a new transaction between two accounts
 * @access Protected Route
 * @access Private
 */
router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);