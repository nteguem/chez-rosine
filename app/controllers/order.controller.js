const orderService = require('../services/order.service');
const userService = require("../services/user.service")
const ResponseService = require('../services/response.service');
const logService = require('../services/log.service');
const ProductService = require("../services/product.service")
const { sendMessageToNumber, sendMediaToNumber } = require('../views/whatsApp/whatsappMessaging');
const { fillPdfFields } = require("../services/fillFormPdf.service");
const moment = require("moment");
moment.locale('fr');  
const pathInvoice = "../templates-pdf/invoice.pdf"

// Créer une nouvelle commande
const createOrder = async (req, res, client) => {
    const orderData = req.body;
    // Créer la commande avec les données reçues
    const response = await orderService.createOrder(orderData, client);

    if (response.success) {
        return ResponseService.success(res, { order: response.order });
    } else {
        return ResponseService.internalServerError(res, { error: response.error });
    }
};

const getOrdersByUser = async (req, res, client) => {
  const userId = req.query.userId; 
  const filters = req.query;
  const limit = parseInt(req.query.limit, 10) || 10; 
  const offset = parseInt(req.query.offset, 10) || 0; 
  const response = await orderService.getOrdersByUser(userId, filters, limit, offset, client);

  if (response.success) {
      return ResponseService.success(res, { orders: response.orders, total: response.total });
  } else {
      return ResponseService.internalServerError(res, { error: response.error });
  }
};




// Mettre à jour le statut de livraison
const updateDeliveryStatus = async (req, res, client) => {
    const { orderId, newStatus } = req.body;
    const response = await orderService.updateDeliveryStatus(orderId, newStatus, client);

    if (response.success) {
        return ResponseService.success(res, { order: response.order });
    } else {
        return ResponseService.notFound(res, { error: response.error });
    }
};

async function handlePaymentMonetbilSuccess(req, res, client) {
  try {
    const { user: rawUser, first_name, email, amount, operator_code, transaction_id, phone, operator_transaction_id, currency } = req.body;
    const [whatappNumberOnly, pseudo, location] = (rawUser.match(/^(\d+)\s*\(([^)]+)\)\s*(.*)$/) || []).slice(1).map(part => part.trim());
    const user = `${whatappNumberOnly} : ${pseudo}`;
    const currentDate = moment().format('dddd D MMMM YYYY');
    
    req.body = { ...req.body, date: currentDate, location, user };

    // Récupération des données client et livraison
    const [dataCustomer, product] = await Promise.all([
      userService.getOne(whatappNumberOnly),
      ProductService.ProductGetOne({ name: first_name }),
    ]);
    console.log("product",product)

      // Vérifier si le produit et le client existent
      if (!product) {
        await logService.addLog(
          `Produit non trouvé.`,
          'handlePaymentMonetbilSuccess',
          'warning'
        );
        return ResponseService.notFound(res, { message: "Produit non trouvé." });
      }
  
      if (!dataCustomer) {
        await logService.addLog(
          `Client non trouvé.`,
          'handlePaymentMonetbilSuccess',
          'warning'
        );
        return ResponseService.notFound(res, { message: "Client non trouvé." });
      }
    // Préparation des données de la commande
    const orderData = {
      products: [product?.product?.id],
      deliveryPerson: dataCustomer?.user?.id,
      customer: dataCustomer?.user?.id,
      deliveryLocation: location,
      totalPrice: amount,
      paymentMethod: operator_code,
      transactionId: transaction_id,
      mobileNumber: phone,
      operatorTransactionId: operator_transaction_id,
      currency,
    };

    // Preparation de la facture pdf du client
    const successMessage = `Félicitations ${first_name} ! Votre paiement a été effectué avec succès. Un livreur vous appellera dans les minutes qui suivent. Ci-joint votre facture.`;
    const pdfBufferInvoice = await fillPdfFields(pathInvoice, req.body);
    const pdfBase64Invoice = pdfBufferInvoice.toString('base64');
    const pdfNameInvoice = `Invoice_${whatappNumberOnly}`;
    const documentType = 'application/pdf';

    // Envoi de la notification , generation de facture client et création de la commande
    await Promise.all([
      sendMediaToNumber(client, whatappNumberOnly, documentType, pdfBase64Invoice, pdfNameInvoice,successMessage),
      orderService.createOrder(orderData)
    ]);

    // Notification aux administrateurs
    const { users: admins } = await userService.list("admin");
    const adminMessage = `Un client (${whatappNumberOnly}) vient de faire un achat. Veuillez consulter la facture ci-jointe.`;
    
    for (const admin of admins) {
      await sendMediaToNumber(client, admin.phoneNumber, documentType, pdfBase64Invoice, pdfNameInvoice);
      await sendMessageToNumber(client, admin.phoneNumber, adminMessage);
    }
    res.status(200).send('Success');
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'handlePaymentMonetbilSuccess',
      'error'
    );
    return ResponseService.internalServerError(res, { error: 'Erreur lors du traitement' });
  }
}

  
  async function handlePaymentMonetbilFailure(req, res, client, operatorMessage) {
    try {
      const whatappNumberOnly = req.body.user.split('(')[0].trim();
      const failureMessage = operatorMessage || `Désolé, Votre paiement mobile pour *${req.body.last_name} ${req.body.first_name}* n'a pas abouti en raison d'une erreur lors de la transaction. Veuillez vérifier vos informations de paiement et réessayer. Si le problème persiste, contactez-nous pour de l'aide. Nous nous excusons pour tout désagrément.\n\nPour toute assistance, Tapez 3 dans le menu principal pour parler directement à un membre de notre équipe.\n\nCordialement,\n\n L'équipe les bons plats`;
      await sendMessageToNumber(client,whatappNumberOnly, failureMessage);
      res.status(200).send('Failure');
    } catch (error) {
      await logService.addLog(
        `${error.message}`,
        'handlePaymentMonetbilFailure',
        'error'
      );
      return ResponseService.internalServerError(res, { error: 'Erreur lors du traitement' });
    }
  }
  
  async function handlePaymentMonetbilNotification(req, res, client) {
    try {
      if (req.body.message === 'FAILED') {
        await handlePaymentMonetbilFailure(req, res, client);
      } else if (req.body.message === 'INTERNAL_PROCESSING_ERROR') {
        const operatorMessage = `Désolé, Votre paiement mobile a rencontré une erreur due à un problème technique avec le service *${req.body.operator}*. Nous travaillons sur la résolution de ce problème. En attendant, nous vous recommandons d'essayer à nouveau plus tard. Désolé pour le dérangement.\n\nPour toute assistance,Tapez 3 dans le menu principal pour parler directement à un membre de notre équipe.\n\n L'équipe les bons plats`;
        await handlePaymentMonetbilFailure(req, res, client, operatorMessage);
      } else if(req.body.message === 'SUCCESSFULL') {
        await handlePaymentMonetbilSuccess(req, res, client);
      }
      else{
        await handlePaymentMonetbilFailure(req, res, client);
      }
    } catch (error) {
      await logService.addLog(
        `${error.message}`,
        'handlePaymentMonetbilNotification',
        'error'
      );
      return ResponseService.internalServerError(res, { error: 'Erreur lors du traitement' });
    }
  }

module.exports = {
    createOrder,
    getOrdersByUser,
    updateDeliveryStatus,
    handlePaymentMonetbilNotification
};
