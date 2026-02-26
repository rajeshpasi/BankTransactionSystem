const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const accountController = require('../controller/account.controller'); 


const router = express.Router();


/**
 * @route POST /api/accounts
 * @desc Create a new account for the authenticated user
 * @access Protected Route
 * @access Private
 */

router.post('/', authMiddleware.authMiddleware, accountController.createAccount);

/**
 * @route GET /api/accounts
 * @desc Get all accounts for the authenticated user
 * @access Protected Route
 * @access Private
 */
router.get('/', authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * @route GET /api/accounts/:accountId
 * @desc Get Account balance and details for the authenticated user
 * @access Protected Route
 * @access Private
 */
router.get('/:accountId', authMiddleware.authMiddleware, accountController.getAccountBalanceController);


module.exports = router; 