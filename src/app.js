const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cokeeParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cokeeParser());

app.use('/api/auth', authRoutes);


module.exports = app;