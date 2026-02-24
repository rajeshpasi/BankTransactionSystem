const accountModel = require('../models/account.model');


const createAccount = async (req, res) => {
    try {
        const user = req.user;

        if (!user || !user._id) {
            return res.status(401).json({ message: 'Unauthorized: user context is missing' });
        }

        const account = await accountModel.create({
            user: user._id
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createAccount
}