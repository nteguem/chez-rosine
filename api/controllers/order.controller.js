const orderService = require('../services/order.service');
const userService = require("../services/user.service")
const ResponseService = require('../services/response.service');
const Product = require("../models/product.model");
const { sendMessageToNumber, sendMediaToNumber } = require('../helpers/whatsApp/whatsappMessaging');
const { fillPdfFields } = require("../services/fillFormPdf.service");
const moment = require("moment");
const pathInvoice = "../templates-pdf/invoice.pdf"

// Créer une nouvelle commande
const createOrder = async (req, res, client) => {
    const orderData = req.body;
    // Créer la commande avec les données reçues
    const response = await orderService.createOrder(orderData, client);

    if (response.success) {
        return ResponseService.success(res, { order: response.order });
    } else {
        return ResponseService.error(res, { error: response.error });
    }
};

// Récupérer les commandes d'un client spécifique
const getOrdersByCustomer = async (req, res, client) => {
    const customerId = req.params.customerId;
    const filters = req.query;
    const response = await orderService.getOrdersByUserWithFilters(customerId, 'customer', filters, client);

    if (response.success) {
        return ResponseService.success(res, { orders: response.orders });
    } else {
        return ResponseService.error(res, { error: response.error });
    }
};

// Récupérer les commandes d'un livreur spécifique
const getOrdersByDeliveryPerson = async (req, res, client) => {
    const deliveryPersonId = req.params.deliveryPersonId;
    const filters = req.query;
    const limit = parseInt(req.query.limit, 10) || 10; 
    const offset = parseInt(req.query.offset, 10) || 0; 

    const response = await orderService.getOrdersByUserWithFilters(deliveryPersonId, 'deliveryPerson', filters, limit, offset, client);

    if (response.success) {
        return ResponseService.success(res, { orders: response.orders, total: response.total });
    } else {
        return ResponseService.error(res, { error: response.error });
    }
};


// Mettre à jour le statut de livraison
const updateDeliveryStatus = async (req, res, client) => {
    const { orderId, newStatus } = req.body;
    const response = await orderService.updateDeliveryStatus(orderId, newStatus, client);

    if (response.success) {
        return ResponseService.success(res, { order: response.order });
    } else {
        return ResponseService.error(res, { error: response.error });
    }
};

async function handlePaymentMonetbilSuccess(req, res, client) {
  try {
    const { user: rawUser, first_name, email, amount, operator_code, transaction_id, phone, operator_transaction_id, currency } = req.body;
    const [whatappNumberOnly, location] = rawUser.split(/[()]/).map(part => part.trim());
    const user = `${whatappNumberOnly})`;
    const currentDate = moment().format('dddd D MMMM YYYY');

    req.body = { ...req.body, date: currentDate, location, user };

    // Récupération des données client et livraison
    const [dataCustomer, dataDelivery, product] = await Promise.all([
      userService.getOne(whatappNumberOnly),
      userService.getOne("23797874621"),
      Product.findOne({ name: first_name })
        .populate({
          path: 'variation',
          match: { price: email },
          select: 'name price',
        }),
    ]);

    // Préparation des données de la commande
    const orderData = {
      products: [product.id],
      deliveryPerson: dataDelivery.id,
      customer: dataCustomer.id,
      deliveryLocation: location,
      totalPrice: amount,
      paymentMethod: operator_code,
      transactionId: transaction_id,
      mobileNumber: phone,
      operatorTransactionId: operator_transaction_id,
      currency,
    };

    // Génération du message de succès et du PDF de facture
    const successMessage = `Félicitations ! Votre paiement ${first_name} a été effectué avec succès. Ci-joint la facture de paiement du forfait.`;
    const pdfBufferInvoice = await fillPdfFields(pathInvoice, req.body);
    const pdfBase64Invoice = pdfBufferInvoice.toString('base64');
    const pdfNameInvoice = `Invoice_${whatappNumberOnly}`;
    const documentType = 'application/pdf';

    // Envoi des notifications et création de la commande
    await Promise.all([
      sendMediaToNumber(client, whatappNumberOnly, documentType, pdfBase64Invoice, pdfNameInvoice),
      sendMessageToNumber(client, whatappNumberOnly, successMessage),
      orderService.createOrder(orderData, client),
    ]);

    res.status(200).send('Success');
  } catch (error) {
    console.error('Erreur lors du traitement de la commande:', error);
    res.status(500).send('Erreur lors du traitement.');
  }
}

  
  async function handlePaymentMonetbilFailure(req, res, client, operatorMessage) {
    try {
      const whatappNumberOnly = req.body.user.split('(')[0].trim();
      const failureMessage = operatorMessage || `Désolé, Votre paiement mobile pour *${req.body.first_name}* n'a pas abouti en raison d'une erreur lors de la transaction. Veuillez vérifier vos informations de paiement et réessayer. Si le problème persiste, contactez-nous pour de l'aide. Nous nous excusons pour tout désagrément.\n\nPour toute assistance, vous pouvez nous contacter sur WhatsApp au +(237)697874621 ou +(237)693505667.\n\nCordialement, L'équipe de predictfoot`;
      await sendMessageToNumber(client,whatappNumberOnly, failureMessage);
      res.status(200).send('Failure');
    } catch (error) {
      console.log(error);
      res.status(500).send('Erreur lors du traitement.');
    }
  }
  
  async function handlePaymentMonetbilNotification(req, res, client) {
    try {
      if (req.body.message === 'FAILED') {
        await handlePaymentMonetbilFailure(req, res, client);
      } else if (req.body.message === 'INTERNAL_PROCESSING_ERROR') {
        const operatorMessage = `Désolé, Votre paiement mobile a rencontré une erreur due à un problème technique avec le service *${req.body.operator}*. Nous travaillons sur la résolution de ce problème. En attendant, nous vous recommandons d'essayer à nouveau plus tard. Désolé pour le dérangement.\n\nPour toute assistance, vous pouvez nous contacter sur WhatsApp au +(237)697874621 ou +(237)693505667.\n\nCordialement, L'équipe Predictfoot`;
        await handlePaymentMonetbilFailure(req, res, client, operatorMessage);
      } else {
        await handlePaymentMonetbilSuccess(req, res, client);
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Erreur lors du traitement.');
    }
  }

module.exports = {
    createOrder,
    getOrdersByCustomer,
    getOrdersByDeliveryPerson,
    updateDeliveryStatus,
    handlePaymentMonetbilNotification
};
