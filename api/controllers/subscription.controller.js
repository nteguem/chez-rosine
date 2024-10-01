const ResponseService = require('../services/response.service');
const { sendMessageToNumber, sendMediaToNumber } = require('../helpers/whatsApp/whatsappMessaging');
const { fillPdfFields } = require("../services/fillFormPdf.service");
const moment = require("moment");
const pathInvoice = "../templates-pdf/invoice.pdf"



async function handlePaymentMonetbilSuccess(req, res, client) {
  try {
    const whatappNumberOnly = req.body.user.split('(')[0].trim();
    req.body.date = moment().format('dddd D MMMM YYYY');
    const successMessage = `Félicitations ! Votre paiement ${req.body.first_name} a été effectué avec succès. Profitez de nos services premium ! Ci-joint la facture de paiement du forfait.`;   
    const pdfBufferInvoice = await fillPdfFields(pathInvoice, req.body)
    const pdfBase64Invoice = pdfBufferInvoice.toString("base64");
    const pdfNameInvoice = `Invoice_${whatappNumberOnly}`;
    const documentType = "application/pdf";
    console.log("whatappNumberOnly",whatappNumberOnly)
    await Promise.all([
      sendMediaToNumber(client,whatappNumberOnly, documentType, pdfBase64Invoice, pdfNameInvoice),
      sendMessageToNumber(client,whatappNumberOnly, successMessage),
    ]); 
    res.status(200).send('Success');
  } catch (error) {
    console.log(error);
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
  handlePaymentMonetbilNotification
};
