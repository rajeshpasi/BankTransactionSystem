const transactionSchemaModel = require('../models/transaction.model');
const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service'); 



const createTransaction = async (req, res) => {
        const { fromAccount, toAccount, amount, idmpotencyKey } = req.body;

        /**
         * Validation: Ensure all required fields are present and valid
         */
        if (!fromAccount || !toAccount || !amount || !idmpotencyKey) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const formUserAccount = await accountModel.findById({_id: fromAccount});
        const toUserAccount = await accountModel.findById({_id: toAccount});

        if (!formUserAccount || !toUserAccount) {
            return res.status(404).json({ message: 'One or both accounts not found' });
        }

        /**
         * validate idmpotencyKey 
         */
        const existingTransaction = await transactionSchemaModel.findOne({ idmpotencyKey });
        if (existingTransaction.status === 'completed') {
            return res.status(200).json({ 
                message: 'Transaction already processed',
                transaction: existingTransaction
            });
        }

        if (existingTransaction.status === 'pending') {
            return res.status(200).json({
                message: 'Transaction is still pending, please wait for completion',
                transaction: existingTransaction
            });
        }

        if (existingTransaction.status === 'failed') {
            return res.status(500).json({
                message: 'Previous transaction attempt failed, you can retry',
                transaction: existingTransaction
            });
        }

        if (existingTransaction.status === 'reversed') {
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

        
}

module.exports = {
    createTransaction
}