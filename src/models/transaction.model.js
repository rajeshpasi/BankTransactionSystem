const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'account', 
        required: [ true, 'Transaction must have a From account'] 
    },
    toAccount: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'account', 
        required: [true, 'Transaction must have a To account']
    },
    status: { 
        type: String, 
        enum: {
            values: ['pending', 'completed', 'failed', 'reversed'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending' 
    },
    amount: { type: Number, required: true },
    idmpotencyKey: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now }
});

const transactionSchemaModel = mongoose.model('transaction', transactionSchema);
module.exports = transactionSchemaModel;