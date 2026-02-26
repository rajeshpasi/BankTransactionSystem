const accountModel = require('../models/account.model');


const createAccount = async (req, res) => {
    try {
        const user = req.user;

        if (!user || !user._id) {
            return res.status(401).json({ message: 'Unauthorized: user context is missing' });
        }

        const account = await accountModel.create({
            user: user._id,
            
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getUserAccountsController = async (req, res) => {
    try {
        const user = req.user;

        const accounts = await accountModel.find({ user: user._id });

        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getAccountBalanceController = async (req, res) => {
    try {
        const user = req.user;
        const accountId = req.params.accountId;

        const account = await accountModel.findOne({ _id: accountId, user: user._id });

        if (!account) {
            return res.status(404).json({ message: 'Account not found or inaccessible' });
        }

        res.status(200).json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



module.exports = {
    createAccount,
    getUserAccountsController,
    getAccountBalanceController,

}