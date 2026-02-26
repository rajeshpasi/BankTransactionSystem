const transactionSchemaModel = require('../models/transaction.model');
const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');



const createTransaction = async (req, res) => {
    const { fromAccount, toAccount, amount, idmpotencyKey } = req.body;

        /**
         * Validation: Ensure all required fields are present and valid
         */
        if (!fromAccount || !toAccount || !amount || !idmpotencyKey) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        if (fromAccount === toAccount) {
            return res.status(400).json({ message: 'Sender and receiver accounts must be different' });
        }

        let session;

        try {

        const formUserAccount = await accountModel.findById({ _id: fromAccount }).populate('user', 'email name');
        const toUserAccount = await accountModel.findById({ _id: toAccount });

        if (!formUserAccount || !toUserAccount) {
            return res.status(404).json({ message: 'One or both accounts not found' });
        }

        if (!req.user || String(formUserAccount.user._id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can only transfer from your own account' });
        }

        /**
         * validate idmpotencyKey 
         */
        const existingTransaction = await transactionSchemaModel.findOne({ idmpotencyKey });
        if (existingTransaction && existingTransaction.status === 'completed') {
            return res.status(200).json({ 
                message: 'Transaction already processed',
                transaction: existingTransaction
            });
        }

        if (existingTransaction && existingTransaction.status === 'pending') {
            return res.status(200).json({
                message: 'Transaction is still pending, please wait for completion',
                transaction: existingTransaction
            });
        }

        if (existingTransaction && existingTransaction.status === 'failed') {
            return res.status(500).json({
                message: 'Previous transaction attempt failed, you can retry',
                transaction: existingTransaction
            });
        }

        if (existingTransaction && existingTransaction.status === 'reversed') {
            return res.status(200).json({
                message: 'Previous transaction was reversed, you can retry',
                transaction: existingTransaction
            });
        }

        /**
         * check status is active for both accounts
         */
        if (formUserAccount.status !== 'active' || toUserAccount.status !== 'active') {
            return res.status(400).json({ message: 'Both accounts must be active to process the transaction' });
        }
        
        /**
         * Derive sender blance from ledger entries and validate sufficient funds
         */

        const balance = await formUserAccount.getBalance();
        if (balance < amount) {
            return res.status(400).json({ message: `Insufficient funds in sender account. Available balance: ${balance}, requested amount: ${amount}` });
        }

        /**
         * Create a new transaction with status 'pending'
         */
        session = await mongoose.startSession();
        session.startTransaction();

        const [ transaction ] = new transactionSchemaModel([{
            fromAccount,
            toAccount,
            amount,
            idmpotencyKey,
            status: 'pending'
        }], { session });

        await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: 'debit'
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: 'credit'
        }], { session });

        transaction.status = 'completed';
        await transaction.save({ session });

        await session.commitTransaction();
        await session.endSession();
        
       await emailService.sendTransactionEmail(formUserAccount.user.email, formUserAccount.user.name, amount, toAccount);

        res.status(201).json({ message: 'Transaction completed successfully', transaction }); 
        } catch (error) {
            if (session) {
                await session.abortTransaction();
                await session.endSession();
            }

            return res.status(500).json({ message: error.message || 'Transaction failed' });
        }
}

async function createInitialFundsTransaction(req, res) {
    return res.status(501).json({ message: 'Initial funds transaction is not implemented yet' });
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}