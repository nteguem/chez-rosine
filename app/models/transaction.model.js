const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true
    },
    operatorTransactionId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['REQUEST_ACCEPTED', 'REQUEST_FAILED', 'COMPLETED', 'CANCELED'],
        default: 'REQUEST_ACCEPTED',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['CM_ORANGEMONEY', 'CM_MTNMOBILEMONEY', 'CM_EUMM'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'XAF',
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    notifyUrl: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['MONETBIL'],
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
