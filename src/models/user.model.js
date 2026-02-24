const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please fill a valid email address']

    },
    name:{
        type: String,
        required: true,  
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    }
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return;
    this.password = await bcrypt.hash(this.password, 12);
})

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
    
}


const userSchemaModel = mongoose.model('user', userSchema);

module.exports = userSchemaModel;