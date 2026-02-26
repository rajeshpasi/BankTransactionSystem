const transactionSchemaModel = require('../models/transaction.model');
const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
const transactionModel = require('../models/transaction.model');

const isTransactionUnsupportedError = (error) => {
    return error?.message?.includes('Transaction numbers are only allowed on a replica set member or mongos');
};

const runWithOptionalTransaction = async (operation) => {
    let session;

    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const result = await operation(session);
        await session.commitTransaction();

        return result;
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
            }
        }

        if (isTransactionUnsupportedError(error)) {
            return operation(null);
        }

        throw error;
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};



const createTransaction = async (req, res) => {
    const { fromAccount, toAccount, amount, idmpotencyKey: requestIdmpotencyKey, idempotencyKey } = req.body;
    const idmpotencyKey = requestIdmpotencyKey || idempotencyKey;

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
        const transaction = await runWithOptionalTransaction(async (session) => {
            const sessionOption = session ? { session } : {};

            const [ createdTransaction ] = await transactionSchemaModel.create([{
                fromAccount,
                toAccount,
                amount,
                idmpotencyKey,
                status: 'pending'
            }], sessionOption);

            await ledgerModel.create([{
                account: fromAccount,
                amount: amount,
                transaction: createdTransaction._id,
                type: 'debit'
            }], sessionOption);

            await ledgerModel.create([{
                account: toAccount,
                amount: amount,
                transaction: createdTransaction._id,
                type: 'credit'
            }], sessionOption);

            createdTransaction.status = 'completed';
            await createdTransaction.save(sessionOption);

            return createdTransaction;
        });
        
       await emailService.sendTransactionEmail(formUserAccount.user.email, formUserAccount.user.name, amount, toAccount);

        res.status(201).json({ message: 'Transaction completed successfully', transaction }); 
        } catch (error) {
            return res.status(500).json({ message: error.message || 'Transaction failed' });
        }
}

const createInitialFundsTransaction = async (req, res) => {
    const { toAccount, amount, idmpotencyKey: requestIdmpotencyKey, idempotencyKey } = req.body
    const idmpotencyKey = requestIdmpotencyKey || idempotencyKey

    if (!toAccount || !amount || !idmpotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and (idmpotencyKey or idempotencyKey) are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const transaction = await runWithOptionalTransaction(async (session) => {
        const sessionOption = session ? { session } : {};

        const [ createdTransaction ] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idmpotencyKey,
            status: 'pending'
        }], sessionOption);

        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount: amount,
            transaction: createdTransaction._id,
            type: 'debit'
        } ], sessionOption);

        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: createdTransaction._id,
            type: 'credit'
        } ], sessionOption);

        createdTransaction.status = 'completed';
        await createdTransaction.save(sessionOption);

        return createdTransaction;
    })

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })

        
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}