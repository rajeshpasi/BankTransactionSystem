const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'account',
        required: [true, 'Ledger entry must be associated with an account'],
        index: true,
        immutable: true
    },
    amount: { 
        type: Number, 
        required: [ true, 'Ledger entry must have an amount'],
        immutable: true
     },
     transaction: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'transaction',
        required: [true, 'Ledger entry must be associated with a transaction'],
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['debit', 'credit'],
            message: 'type must be either debit or credit'
        },
        required: [true, 'Ledger entry must have a type'],
        immutable: true
    }
});


const preventLegerModification = () => {
    throw new Error('Ledger entries cannot be modified after creation');
}

ledgerSchema.pre('updateOne', preventLegerModification);
ledgerSchema.pre('findOneAndUpdate', preventLegerModification);
ledgerSchema.pre('findOneAndDelete', preventLegerModification);
ledgerSchema.pre('findOneAndReplace', preventLegerModification);
ledgerSchema.pre('findOneAndRemove', preventLegerModification);
ledgerSchema.pre('deleteOne', preventLegerModification);
ledgerSchema.pre('deleteMany', preventLegerModification);


const ledgerModel = mongoose.model('ledger', ledgerSchema);
module.exports = ledgerModel;