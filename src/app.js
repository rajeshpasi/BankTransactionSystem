const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cokeeParser = require('cookie-parser');
const accountRouter = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cokeeParser());

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRouter);
app.use('/api/transactions', transactionRoutes);

module.exports = app;