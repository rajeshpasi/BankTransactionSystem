const express = require('express');
const authController = require('../controller/auth.controller');

const router = express.Router();

router.post('/register',
  authController.userRegister
);

router.post('/login',
  authController.userLogin
);

module.exports = router;