const { sendMessageToNumber, sendMediaToNumber, replyToMessage } = require('./whatsappMessaging');
const logger = require("../logger");
const moment = require('moment');
const { makePayment } = require("../../services/monetbil.service");

// Objet pour stocker l'étape actuelle et les réponses de l'utilisateur
let orderData = {};

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
    location: "Carrefour Rail Ngousso"
};

const generateProductList = () => {
    let productList = "📋 Choisissez un produit :\n\n";
    const uniqueProducts = [...new Set(productsData.products.map(product => product.name))];
    uniqueProducts.forEach((product, index) => {
        productList += `${index + 1}️. *${product}* - Tapez ${index + 1}\n`;
    });
    return productList;
};

const generateProductType = () => {
    const uniqueTypes = [...new Set(productsData.products.map(p => p.type))];
    let typeList = "📋 Choisissez le type :\n\n";
    uniqueTypes.forEach((type, index) => {
        typeList += `${index + 1}️. *${type}* - Tapez ${index + 1}\n`;
    });
    return typeList;
};

const formatOrderSummary = (product, quantity, deliveryFee, totalPrice, deliveryMessage, note = "") => {
    return `📋 *Récapitulatif de votre commande :*\n\n` +
        `Produit : ${product?.name}\n` +
        `Quantité : ${quantity}\n` +
        `Prix : ${product?.price * quantity} CFA\n` +
        `Frais de livraison : ${deliveryFee} CFA\n` +
        `Total à payer : ${totalPrice} CFA\n` +
        `Lieu : ${deliveryMessage}\n\n` +
        `Souhaitez-vous procéder au paiement ? Tapez Oui pour continuer ou Non pour annuler.\n\n` +
        `${note}`;
}

const requestPaiement = async (user, amount, mobileMoneyPhone,product,quantity) => 
    {
        const paymentResponse = await makePayment(user, amount, mobileMoneyPhone,product,quantity);

      try {
        if (paymentResponse.status === "REQUEST_ACCEPTED") {
            return `Paiement en cours. Utilisez le code USSD ${paymentResponse.channel_ussd} pour compléter le paiement via ${paymentResponse.channel_name}.`;
          } else {
            return `Erreur lors de l'initiation du paiement : ${paymentResponse.message}`;
          }
      }
      catch (error) {
        return `Erreur lors de l'initiation du paiement`;
    }
    }


// Fonction pour gérer les commandes de l'utilisateur
const orderCommander = async (user, msg, client) => {
    try {
        const phoneNumber = user.data.phoneNumber;
        if (!orderData[phoneNumber]) {
            orderData[phoneNumber] = {
                step: 1,
                answers: {}
            };
        }
        const userInput = msg.body;
        orderData[phoneNumber].answers["user"] = user.data;

        if (userInput === "*") {
            orderData[phoneNumber].step = Math.max(orderData[phoneNumber].step - 1, 1);
        } else {
            switch (orderData[phoneNumber].step) {
                case 1:
                    const uniqueProducts = [...new Set(productsData.products.map(product => product.name))];
                    const productIndex = parseInt(userInput) - 1;
                    if (productIndex >= 0 && productIndex < uniqueProducts.length) {
                        const selectedProductName = uniqueProducts[productIndex];
                        orderData[phoneNumber].answers["ChoiceNameProduct"] = selectedProductName;
                        orderData[phoneNumber].step++;
                    } else {
                        await replyToMessage(client, msg, "Veuillez choisir une option valide.");
                    }
                    break;

                case 2:
                    const typeIndex = parseInt(userInput) - 1;
                    const typesProducts = [...new Set(productsData.products.map(p => p.type))];
                    const selectedProductName = orderData[phoneNumber].answers["ChoiceNameProduct"];
                    if (typeIndex >= 0 && typeIndex < typesProducts.length) {
                        const selectedType = typesProducts[typeIndex];
                        const product = productsData.products.find(p => p.name === selectedProductName && p.type === selectedType);
                        orderData[phoneNumber].answers["ChoiceProduct"] = product;
                        orderData[phoneNumber].step++;
                    } else {
                        await replyToMessage(client, msg, "Veuillez choisir une option valide.");
                    }
                    break;

                case 3:
                    const isValidNumber = /^\d+$/.test(userInput.trim());

                    if (!isValidNumber) {
                        await replyToMessage(client, msg, "Veuillez entrer un nombre valide.");
                    } else {
                        const quantity = parseInt(userInput, 10); // Convertir en nombre entier
                        if (quantity >= 10) {
                            orderData[phoneNumber].answers["QuantityProduct"] = quantity;
                            orderData[phoneNumber].step++;
                        } else {
                            await replyToMessage(client, msg, "Le minimum est 10. Tapez à nouveau un nombre valide.");
                        }
                    }
                    break;

                case 4:
                    // Si l'utilisateur choisit la livraison
                    if (userInput === "1") {
                        orderData[phoneNumber].step = 4.1; // Sous-étape pour demander l'adresse de livraison
                    }
                    // Si l'utilisateur choisit le retrait en point de vente
                    else if (userInput === "2") {
                        orderData[phoneNumber].answers["Location"] = productsData.location;
                        orderData[phoneNumber].step++;
                    } else {
                        await replyToMessage(client, msg, "Veuillez choisir une option valide.");
                    }
                    break;

                case 4.1:
                    // Réception de l'adresse de livraison
                    orderData[phoneNumber].answers["Location"] = userInput;
                    orderData[phoneNumber].step = Math.floor(orderData[phoneNumber].step) + 1;
                    break;

                case 5:
                    // Logique pour l'étape finale
                    if (userInput.toLowerCase() === "oui") {
                        orderData[phoneNumber].answers["RecapConfirm"] = userInput;
                        orderData[phoneNumber].step++;
                    } else if (userInput.toLowerCase() === "non") {
                        (orderData[phoneNumber]) = { step: 1, answers: {} };
                        replyToMessage(client, msg, "Commande annulée. Tapez # pour revenir au menu principal.");
                    } else {
                        replyInvalid(msg, client, user, "Veuillez répondre par Oui ou Non.");
                    }
                    break;
                case 6:
                    const mobileMoneyNumber = userInput;
                    if (!/^6[0-9]{8}$/.test(mobileMoneyNumber)) {
                     msg.reply("Numéro de téléphone mobile money invalide. Veuillez saisir un numéro valide.");
                    }
                    else{
                        orderData[phoneNumber].answers["mobileMoneyNumber"] = userInput;
                        orderData[phoneNumber].step++;   
                    }
                    break;
                case 7:
                    // Logique pour l'étape finale
                    (orderData[phoneNumber]) = { step: 1, answers: {} };
                    // Tu peux ajouter ici la logique pour finaliser la commande
                    break;
                default:
                    replyToMessage(client, msg, "Étape inconnue.");
                    break;
            }
        }
        await sendStepMessage(client, phoneNumber, orderData[phoneNumber].step);

    } catch (error) {
        logger.error("Erreur lors du traitement de la commande", error);
    }
};

const steps = [
    { message: generateProductList() },
    { message: generateProductType() },
    { message: `Combien en voulez-vous ? (Minimum 10)` },
    {
        message: `Livraison ou retrait ?\n\n1. *Livraison* - Tapez 1\n2. *Retrait en point de vente* - Tapez 2.`,
        substeps: {
            "4.1": {
                message: `Veuillez indiquer le lieu exact de livraison :\n\n📝 *Notez bien* : votre livreur livrera précisément à cet endroit.`
            }
        }
    },
    {
        message: (phoneNumber) => {
            const product = orderData[phoneNumber].answers["ChoiceProduct"];
            const quantity = orderData[phoneNumber].answers["QuantityProduct"];
            const deliveryFee = productsData.deliveryFee;
            const totalPrice = orderData[phoneNumber].answers["Location"] === productsData.location ? product.price * quantity + deliveryFee : product.price * quantity ;
            const deliveryMessage = orderData[phoneNumber].answers["Location"];
            const note = orderData[phoneNumber].answers["Location"] === productsData.location ? `📝 *Notez bien* : Récupération au ${productsData.location}` : "📝 *Notez bien* : Un livreur prendra attache avec vous dans les minutes qui suivent après confirmation de votre commande.";

            return formatOrderSummary(product, quantity, deliveryFee, totalPrice, deliveryMessage, note);
        }
    },
    { message: `Fournissez votre numéro de Mobile Money pour le paiement.` },
    {
        message: async (phoneNumber) => {
            const product = orderData[phoneNumber].answers["ChoiceProduct"];
            const quantity = orderData[phoneNumber].answers["QuantityProduct"];
            const mobileMoneyPhone = orderData[phoneNumber].answers["mobileMoneyNumber"];
            const deliveryFee = productsData.deliveryFee;
            const totalPrice = orderData[phoneNumber].answers["Location"] === productsData.location ? product.price * quantity + deliveryFee : product.price * quantity ;
            const user = orderData[phoneNumber].answers["user"];
            const result = await requestPaiement(user, totalPrice, mobileMoneyPhone,product,quantity);
            return result;
        }
    },
];

const getCurrentStepMessage = (step) => {
    const stepIndex = Math.floor(step) - 1;
    const currentStep = steps[stepIndex];
    if (!currentStep) return null;

    // Si c'est une sous-étape, on vérifie dans les sous-étapes
    if (currentStep.substeps && currentStep.substeps[step]) {
        return currentStep.substeps[step].message;
    }

    return currentStep.message;
};

const getTotalSteps = () => {
    return steps.length;
};

const sendStepMessage = async (client, phoneNumber, step) => {
    const currentStepMessage = getCurrentStepMessage(step);
    if (currentStepMessage) {
        let stepMessage = "";

        // Vérifier si l'étape contient une fonction au lieu d'un message statique
        if (typeof currentStepMessage === 'function') {
            // Appeler la fonction pour générer le message avec le phoneNumber
            stepMessage = await currentStepMessage(phoneNumber);
        } else {
            stepMessage = currentStepMessage;
        }

        const fullStepMessage = `Étape ${Math.floor(step)}/${getTotalSteps()}\n\n${stepMessage}\n\n`;
        const additionalMessage = (step === 1 || step === getTotalSteps())
            ? "_Tapez # pour revenir au menu principal._"
            : "_Tapez * pour revenir en arrière, # pour revenir au menu principal._";

        await sendMessageToNumber(client, phoneNumber, fullStepMessage + additionalMessage);
    }
};


module.exports = {
    orderCommander,
    sendStepMessage
};
