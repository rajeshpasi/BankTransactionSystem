const momgoose = require('mongoose');
const ledgerModel = require('./ledger.model');

const accountSchema = new momgoose.Schema({
    user: {
        type: momgoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [ true, 'User reference is required' ],
        index: true
    },
    status: {
        type: String,
        enum: { 
            values: ['active', 'frozen', 'suspended'],
            message: 'Status must be either active, frozen, or suspended',
        },
        default: 'active',
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
},{timestamps: true});

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function() {
    const balance = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        { $group:{
            _id: null,
            totolDebit: {
                $sum: {
                    $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0 ]
                }
            },
            totalCredit: {
                $sum: {
                    $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0 ]
                }
            }
        }

         },
        { $project: {
            _id: 0,
            balance: { $subtract: ['$totalCredit', '$totalDebit'] }
        }}
    ])

    if (balance.length === 0) {
        return 0;
    }

    return balance[0].balance;
}

const accountModel = momgoose.model('account', accountSchema);

module.exports = accountModel;