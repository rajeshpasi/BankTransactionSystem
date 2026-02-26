const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const tokenBlackListModel = require('../models/blackList.model');

/**
 * - User registration controller
 * - POST /api/auth/register
 */

const userRegister = async (req, res) => {
    const { email, name, password } = req.body || {};

    if (!email || !name || !password) {
        return res.status(400).json({
            message: 'name, email and password are required',
            success: false
        });
    }

    const isUserExist = await userModel.findOne({ email });

    if (isUserExist) {
        return res.status(422).json({ 
            message: 'User already exists',
            success: false
        });
    }

    const user = await userModel.create({
        email,
        name,
        password
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token);

    await emailService.sendRegistrationEmail(user.email, user.name);

    return res.status(201).json({
        message: 'User registered successfully',
        success: true,
        user:{
            email: user.email,
            name: user.name,
            id: user._id
        },
        token
    });
}


/**
 * - User login controller
 * - POST /api/auth/login
 */
const userLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'email and password are required',
            success: false
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
            success: false
        });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: 'Invalid password',
            success: false
        });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token);

    return res.status(200).json({
        message: 'User logged in successfully',
        success: true,
        user: {
            email: user.email,
            name: user.name,
            id: user._id
        },
        token
    });
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}


module.exports = {
    userRegister,
    userLogin,
    userLogoutController    
}