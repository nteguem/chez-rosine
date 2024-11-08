const Order = require('../models/order.model');
const User = require("../models/user.model");
const logService = require('./log.service');
async function createOrder(orderData, client) {
    try {
        const newOrder = new Order(orderData);

        await newOrder.save();
        return { success: true, order: newOrder };
    } catch (error) {
        await logService.addLog(
            `${error.message}`,
            'createOrder',
            'error'
        );
        return { success: false, error: 'Failed to create order.' };
    }
}

// Récupérer les commandes d'un utilisateur spécifique avec des filtres
async function getOrdersByUser(userId, filters = {}, limit = 10, offset = 0, client) {
    try {
        // Vérifier le rôle de l'utilisateur
        const user = await User.findById(userId).select('role');
        if (!user) {
            return { success: false, error: 'User not found.' };
        }

        let query = {};

        // Ajuster la requête en fonction du rôle
        if (user.role === 'user') {
            query.customer = userId; // Si c'est un client, filtre par customer
        } else if (user.role === 'deliveryPerson') {
            query.deliveryPerson = userId; // Si c'est un livreur, filtre par deliveryPerson
        }

        // Ajouter dynamiquement les filtres à la requête s'ils sont définis
        if (filters.deliveryStatus) {
            query.deliveryStatus = filters.deliveryStatus; // Vérifie le statut de livraison
        }
        if (filters.startDate && filters.endDate) {
            query.createdAt = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) }; // Plage de dates
        }
        if (filters.productId) {
            query.products = filters.productId; // Filtre par produit
        }

        // Compter le total des commandes qui correspondent aux critères
        const totalCount = await Order.countDocuments(query);

        // Rechercher les commandes avec pagination et population
        const orders = await Order.find(query)
            .populate('customer', 'name')
            .populate('products', 'name')
            .populate('deliveryPerson', 'name')
            .skip(offset)
            .limit(limit);

        return { success: true, orders, total: totalCount };
    } catch (error) {
        await logService.addLog(
            `${error.message}`,
            'getOrdersByUser',
            'error'
        );
        return { success: false, error: 'Failed to fetch orders.' };
    }
}



// Mettre à jour le statut de livraison d'une commande
async function updateDeliveryStatus(orderId, newStatus, client) {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { deliveryStatus: newStatus }, { new: true });

        if (!updatedOrder) {
            return { success: false, error: 'Order not found.' };
        }

        return { success: true, order: updatedOrder };
    } catch (error) {
        await logService.addLog(
            `${error.message}`,
            'updateDeliveryStatus',
            'error'
        );
        return { success: false, error: 'Failed to update delivery status.' };
    }
}

module.exports = {
    createOrder,
    getOrdersByUser,
    updateDeliveryStatus,
};
