const { menuData } = require("../../data");
const logger = require('../logger');
const { sendMessageToNumber,replyToMessage } = require('./whatsappMessaging');
const moment = require('moment');
const {simulateTyping} = require("../utils")

const Steps = {};

// Données des produits stockées directement dans le fichier
const productsData = {
  products: [
    { "name": "Pilis", "type": "Viande", "price": 1500 },
    { "name": "Pilis", "type": "Poisson", "price": 1600 },
    { "name": "Samoussas", "type": "Viande", "price": 1200 },
    { "name": "Samoussas", "type": "Poisson", "price": 1300 },
    { "name": "Nems", "type": "Viande", "price": 1400 },
    { "name": "Nems", "type": "Poisson", "price": 1500 }
  ],
  deliveryFee: 500,
  location:"Carrefour Rail Ngousso"
};

// Réinitialiser l'état utilisateur
const reset = (user) => {
  Steps[user.data.phoneNumber] = { currentMenu: "mainMenu" };
};

// Répondre pour les entrées invalides
const replyInvalid = async (msg, client, user, message = "Veuillez choisir une option valide.") => {
  if (user.exist) {
    replyToMessage(client,msg,message);
  }
  if (Steps[user.data.phoneNumber].currentMenu === "mainMenu") {
    await sendMessageToNumber(client, user.data.phoneNumber, menuData(user.data.pseudo, user.exist, generateProductMenuContent()));
  }
};

// Générer dynamiquement la liste des produits à partir des données
const generateProductList = () => {
  let productList = "📋 Choisissez un produit :\n\n";
  const uniqueProducts = [...new Set(productsData.products.map(product => product.name))];
  uniqueProducts.forEach((product, index) => {
    productList += `${index + 1}️. *${product}* - Tapez ${index + 1}\n`;
  });
  return productList;
};
// Générer dynamiquement le contenu du menu produit
const generateProductMenuContent = () => {
  const uniqueProducts = [...new Set(productsData.products.map(product => product.name))];
  return `📋 Menu des produits :\n\n` + uniqueProducts.map((product, index) => `${index + 1}. ${product}`).join('\n') + `\n\nTapez # pour revenir au menu principal.`;
};

// Gérer les choix de type de produit
const handleProductTypeChoice = (msg, client, user, productName) => {
  const selectedProducts = productsData.products.filter(p => p.name === productName);

  // Extraire les types uniques
  const uniqueTypes = [...new Set(selectedProducts.map(p => p.type))];

  // Générer dynamiquement la liste des types disponibles
  let typeList = "📋 Choisissez le type :\n\n";
  uniqueTypes.forEach((type, index) => {
    typeList += `${index + 1}️. *${type}* - Tapez ${index + 1}\n`;
  });

  // Envoyer la liste des types à l'utilisateur
  replyToMessage(client,msg,typeList);

  // Stocker le nom du produit sélectionné et passer à l'étape suivante
  Steps[user.data.phoneNumber].selectedProductName = productName;
  Steps[user.data.phoneNumber].productTypes = uniqueTypes;
  Steps[user.data.phoneNumber].currentMenu = "chooseProductType";
};

// Gérer la sélection du type (Viande ou Poisson)
const handleTypeSelection = (msg, client, user) => {
  const selectedProductName = Steps[user.data.phoneNumber].selectedProductName;
  const selectedTypes = Steps[user.data.phoneNumber].productTypes;

  // Vérifier si l'entrée est valide
  const typeIndex = parseInt(msg.body) - 1;
  if (typeIndex >= 0 && typeIndex < selectedTypes.length) {
    const selectedType = selectedTypes[typeIndex];

    // Filtrer les produits en fonction du type sélectionné
    const product = productsData.products.find(p => p.name === selectedProductName && p.type === selectedType);

    Steps[user.data.phoneNumber].product = product;
    replyToMessage(client,msg,`Vous avez choisi *${product.name} : ${product.type}*. Combien en voulez-vous ? (Minimum 10)`);
    Steps[user.data.phoneNumber].currentMenu = `${product.name.toLowerCase()}Quantity`;
  } else {
    replyInvalid(msg, client, user, "Option invalide. Veuillez choisir un type correct.");
  }
};

// Gérer la quantité
const handleQuantityChoice = (msg, client, user) => {
  const quantity = parseInt(msg.body);
  // Vérifier si l'entrée n'est pas un chiffre
  if (isNaN(quantity)) {
    replyToMessage(client,msg,"Veuillez entrer un nombre valide.");
  } else if (quantity >= 10) {
    const product = Steps[user.data.phoneNumber].product;
    Steps[user.data.phoneNumber].quantity = quantity;
    replyToMessage(client,msg,`📋 Vous avez commandé ${quantity} ${product.name}. Livraison ou retrait ?\n\n1. *Livraison* - Tapez 1\n2. *Retrait en point de vente* - Tapez 2.`);
    Steps[user.data.phoneNumber].currentMenu = "deliveryOrPickup";
  } else {
    replyToMessage(client,msg,"Le minimum est 10. Tapez à nouveau un nombre valide.");
  }
};


// Gérer la confirmation
const handleConfirmation = (msg, user, nextStep, msgReply) => {
  if (msg.body.toLowerCase() === "oui") {
    replyToMessage(client,msg,msgReply);
    Steps[user.data.phoneNumber].currentMenu = nextStep;
  } else if (msg.body.toLowerCase() === "non") {
    reset(user);
    replyToMessage(client,msg,"Commande annulée. Tapez # pour revenir au menu principal.");
  } else {
    replyInvalid(msg, client, user, "Veuillez répondre par Oui ou Non.");
  }
};

// Gérer la planification de la livraison
const handleDeliverySchedule = (msg, client, user) => {
  const currentDateTime = moment().format('DD/MM/YYYY HH:mm');
  if (msg.body === "1") {
              Steps[user.data.phoneNumber].deliveryType = "Instantanée";
           generateOrderSummary(user, "Instantanée", productsData, msg,client);
        } else if (msg.body === "2") {
                  Steps[user.data.phoneNumber].deliveryType = "à une date ultérieure";
                  replyToMessage(client,msg,`Veuillez entrer la date et l'heure dans le format JJ/MM/AAAA HH:MM (ex: ${currentDateTime}) pour la livraison à une date ultérieure.`);
                  Steps[user.data.phoneNumber].currentMenu = "scheduledDelivery";
                } else {
    replyInvalid(msg, client, user);
  }
};

// Gérer la livraison à une date ultérieure
const handleScheduledDelivery = (msg, client, user) => {
  // Regex pour valider le format JJ/MM/AAAA HH:MM
  const dateTimePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
  // Obtenir la date et l'heure actuelles formatées avec Moment.js
  const currentDateTime = moment().format('DD/MM/YYYY HH:mm');
  if (dateTimePattern.test(msg.body)) {
    Steps[user.data.phoneNumber].deliveryDay = msg.body;
    generateOrderSummary(user, "à une date ultérieure", productsData, msg,client);
  } else {
    replyToMessage(client,msg,`Format invalide. Veuillez entrer la date et l'heure dans le format JJ/MM/AAAA HH:MM (ex: ${currentDateTime}).`);
  }
};


function generateOrderSummary(user, deliveryType, productsData, msg,client) {
  const phoneNumber = user.data.phoneNumber;
  const userSteps = Steps[phoneNumber];

  userSteps.currentMenu = "confirmDelivery";
  userSteps.deliveryType = deliveryType;

  const { product, quantity } = userSteps;
  const deliveryFee = deliveryType === "Surplace" ? 0 : productsData.deliveryFee;
  const totalPrice = product.price * quantity + deliveryFee;

  const deliveryMessage = generateDeliveryMessage(deliveryType, userSteps.deliveryDay);
  const note = deliveryType === "Surplace" ? `📝 *Notez bien* : Récupération au ${productsData.location}` : "📝 *Notez bien* : Un livreur prendra attache avec vous dans les minutes qui suivent après confirmation de votre commande.";

  replyToMessage(client,msg,formatOrderSummary(product, quantity, deliveryFee, totalPrice, deliveryMessage, note));
}

function generateDeliveryMessage(deliveryType, deliveryDay) {
  if (deliveryType === "Instantanée") {
    return "Date de livraison : Dans les heures qui suivent.";
  } else if (deliveryType === "à une date ultérieure") {
    return `Date de livraison : ${deliveryDay}`;
  }
  return '';
}

function formatOrderSummary(product, quantity, deliveryFee, totalPrice, deliveryMessage, note="") {
  return `📋 *Récapitulatif de votre commande :*\n\n` +
         `Produit : ${product.name}\n` +
         `Quantité : ${quantity}\n` +
         `Prix : ${product.price * quantity} CFA\n` +
         `Frais de livraison : ${deliveryFee} CFA\n` +
         `Total à payer : ${totalPrice} CFA\n` +
         `${deliveryMessage}\n\n` +
         `Souhaitez-vous procéder au paiement ? Tapez Oui pour continuer ou Non pour annuler.\n\n` +
         `${note}`;
}


// Commandes utilisateur
const UserCommander = async (user, msg, client) => {
  try {
    if (!msg.isGroup) {
      if (!Steps[user.data.phoneNumber]) reset(user);

      if (msg.body === "#") {
        reset(user);
        replyToMessage(client,msg,menuData(user.data.pseudo, user.exist, generateProductMenuContent()));
        return;
      }
      const { currentMenu } = Steps[user.data.phoneNumber];
      switch (currentMenu) {
        case "mainMenu":
          switch (msg.body) {
            case "1":
              (Steps[user.data.phoneNumber].currentMenu) = "orderMenu";
              replyToMessage(client,msg,generateProductList());  // Afficher la liste dynamique des produits
              break;
            case "2":
              Steps[user.data.phoneNumber].currentMenu = "promotionsMenu";
              replyToMessage(client,msg,"📋 Offres spéciales : 10% sur 30 Nems, livraison gratuite dès 10 000 CFA.");
              break;
            case "3":
              Steps[user.data.phoneNumber].currentMenu = "assistanceMenu";
              replyToMessage(client,msg,"📋 Assistance : contactez-nous au 678 123 456.");
              break;
            default:
              await replyInvalid(msg, client, user);
          }
          break;

        case "orderMenu":
          const uniqueProducts = [...new Set(productsData.products.map(product => product.name))];
          const productIndex = parseInt(msg.body) - 1;

          if (productIndex >= 0 && productIndex < uniqueProducts.length) {
            const selectedProductName = uniqueProducts[productIndex];
            handleProductTypeChoice(msg, client, user, selectedProductName);
          } else {
            await replyInvalid(msg, client, user);
          }
          break;

        case "chooseProductType":
          handleTypeSelection(msg, client, user);
          break;

        case Steps[user.data.phoneNumber].product.name.toLowerCase() + "Quantity":
          handleQuantityChoice(msg, client, user);
          break;
        case "deliveryAddress":
          Steps[user.data.phoneNumber].deliveryAddress = msg.body;
          // Après avoir saisi l'adresse, demander le type de livraison
          replyToMessage(client,msg,"📋 Souhaitez-vous une livraison instantanée ou à une date ultérieure ?\n\n1. *Instantanée* - Tapez 1\n2. *à une date ultérieure* - Tapez 2");
          (Steps[user.data.phoneNumber].currentMenu) = "deliveryTiming";
          break;

        case "deliveryTiming":
          handleDeliverySchedule(msg, client, user)
          break;
          case "scheduledDelivery":
            handleScheduledDelivery(msg, client, user);
            break;
        case "deliveryOrPickup":
          if (msg.body === "1") {
            replyToMessage(client,msg,"Veuillez indiquer le lieu exact de livraison :\n\n📝 *Notez bien* : votre livreur livrera précisément à cet endroit.");
            Steps[user.data.phoneNumber].currentMenu = "deliveryAddress";
          } else if (msg.body === "2") {
            generateOrderSummary(user, "Surplace", productsData, msg,client);
          } else {
            await replyInvalid(msg, client, user);
          }
          break;
        case "confirmDelivery":
          handleConfirmation(msg, user, "mobileMoneyNumber", "Fournissez votre numéro de Mobile Money pour le paiement.");
          break;
        case "mobileMoneyNumber":
          replyToMessage(client,msg,"Merci pour votre commande. Confirmation bientôt.");
          reset(user);
          break;

        default:
          await replyInvalid(msg, client, user);
      }
    }
  } catch (error) {
    logger(client).error(error);
  }
};

module.exports = {
  UserCommander,
};