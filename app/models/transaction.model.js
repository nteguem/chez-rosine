const mongoose = require('mongoose');
const Wallet = require('./wallet.model'); 

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

// Middleware Post-Save pour la mise à jour du portefeuille
transactionSchema.post('findOneAndUpdate', async function (doc, next) {
    try {
        if (!doc) return next();

        // Vérifiez si le statut est passé à "COMPLETED"
        if (doc.status === 'COMPLETED') {
            const { paymentMethod, amount } = doc;

            // Recherchez ou créez un portefeuille pour l'opérateur correspondant
            let wallet = await Wallet.findOne({ operator: paymentMethod });

            if (!wallet) {
                // Créez un portefeuille si inexistant
                wallet = new Wallet({
                    operator: paymentMethod,
                    totalRevenue: 0
                });
            }

            // Ajoutez le montant au revenu total
            wallet.totalRevenue += amount;
            wallet.lastUpdated = Date.now();

            // Sauvegardez le portefeuille
            await wallet.save();
        }

        next();
    } catch (error) {
        console.error('Error updating wallet:', error);
        next(error); 
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
