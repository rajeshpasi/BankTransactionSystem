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

module.exports = router; 