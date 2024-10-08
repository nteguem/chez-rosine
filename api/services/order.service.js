const Order = require('../models/order.model');
const logger = require('../helpers/logger');

async function createOrder(orderData, client) {
    try {
        const newOrder = new Order(orderData);

        await newOrder.save();
        return { success: true, order: newOrder };
    } catch (error) {
        logger(client).error('Error creating order:', error);
        return { success: false, error: 'Failed to create order.' };
    }
}

// Récupérer les commandes d'un utilisateur spécifique avec des filtres
async function getOrdersByUserWithFilters(userId, role, filters, limit = 10, offset = 0, client) {
    try {
        let query = { [role]: userId };

        if (filters.status) {
            query.deliveryStatus = filters.status;
        }

        // Compter le total des commandes qui correspondent aux critères
        const totalCount = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate('customer', 'name')
            .populate('products', 'name')
            .populate('deliveryPerson', 'name')
            .skip(offset)
            .limit(limit); 

        return { success: true, orders, total: totalCount };
    } catch (error) {
        logger(client).error(`Error fetching orders for ${role}:`, error);
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
        logger(client).error('Error updating delivery status:', error);
        return { success: false, error: 'Failed to update delivery status.' };
    }
}

module.exports = {
    createOrder,
    getOrdersByUserWithFilters,
    updateDeliveryStatus,
};
