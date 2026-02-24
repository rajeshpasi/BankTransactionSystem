const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');




const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found for this token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    } 
}


module.exports = {authMiddleware};