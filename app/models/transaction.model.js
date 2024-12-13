const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    payload: {
        type: Object,
        required: true
    },
    message: {
        type: String,
        default: null
    },
    flow: {
        type: String,
        default: null
    },
    channel_ussd: {
        type: String,
        default: null
    },
    channel_name: {
        type: String,
        default: null
    },
    channel: {
        type: String,
        default: null
    },
    paymentId: {
        type: String,
        default: null
    },
    createdAt: {
    type: Date,
    default: Date.now
}
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
