const { sendMessageToNumber, sendMediaToNumber, replyToMessage } = require('./whatsappMessaging');
const moment = require('moment');
const { makePayment } = require("../../services/monetbil.service");
const { getVariations } = require("../../services/variation.service");
const { getCategoryByName } = require('../../services/category.service');
const { listProducts } = require('../../services/product.service');
const logService = require('../../services/log.service');

// Objet pour stocker l'étape actuelle et les réponses de l'utilisateur
let orderData = {};
let listVariations;
const productsData = {
    deliveryFee: 1000,
    location: "Carrefour Rail Ngousso"
};

const generateProductList = async () => {
    const { category } = await getCategoryByName("mignardises");
    const { products } = await listProducts(category.id)
    productsData.products = (products);
    let productList = "📋 Choisissez un produit :\n\n";
    const uniqueProducts = [...new Set(productsData?.products.map(product => product.name))];
    uniqueProducts.forEach((product, index) => {
        productList += `${index + 1}️. *${product}* - Tapez ${index + 1}\n`;
    });
    return productList;
};

const generateProductType = async () => {
    const { category } = await getCategoryByName("mignardises");
    const { variations } = await getVariations(category.id);
    listVariations = (variations);
    const uniqueTypes = [...new Set(variations.map(p => p.name))];
    let typeList = "📋 Choisissez le type :\n\n";
    uniqueTypes.forEach((type, index) => {
        typeList += `${index + 1}️. *${type}* - Tapez ${index + 1}\n`;
    });
    return typeList;
};

const formatOrderSummary = (product, quantity, deliveryFee, totalPrice, deliveryMessage, note = "") => {
    return `📋 *Récapitulatif de votre commande :*\n\n` +
        `Produit : ${product?.name}-${product?.variation.name} \n` +
        `Prix unitaire : ${product?.variation.price} FCFA\n` +
        `Quantité : ${quantity}\n` +
        `Prix : ${product?.variation?.price * quantity} FCFA\n` +
        `Frais de livraison : ${deliveryFee} FCFA\n` +
        `Total à payer : ${totalPrice} FCFA\n` +
        `Lieu : ${deliveryMessage}\n\n` +
        `Souhaitez-vous procéder au paiement ? Tapez Oui pour continuer ou Non pour annuler.\n\n` +
        `${note}`; 
}

const requestPaiement = async (user, amount, mobileMoneyPhone, product, quantity) => {
    const paymentResponse = await makePayment(user, amount, mobileMoneyPhone, product, quantity, orderData[user.phoneNumber].answers["Location"]);

    try {
        if (paymentResponse.status === "REQUEST_ACCEPTED") {
            return `Paiement en cours. Utilisez le code USSD ${paymentResponse.channel_ussd} pour compléter le paiement via ${paymentResponse.channel_name}.`;
        } else {
            return `Erreur lors de l'initiation du paiement : ${paymentResponse.message}`;
        }
    }
    catch (error) {
        await logService.addLog(
            `${error.message}`,
            'requestPaiement',
            'error'
        );
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
                    //Logique  choix du produit
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
                    //Logique  choix du type de produit
                    const variationIndex = parseInt(userInput) - 1;
                    if (variationIndex >= 0 && variationIndex < listVariations.length) {
                        const selectedVariation = listVariations[variationIndex];
                        const selectedProductName = orderData[phoneNumber].answers["ChoiceNameProduct"];
                        const product = productsData.products.find(p => p.name === selectedProductName && p.variation.id === selectedVariation.id);
                        orderData[phoneNumber].answers["ChoiceProduct"] = product;
                        orderData[phoneNumber].step++;
                    } else {
                        await replyToMessage(client, msg, "Veuillez choisir une option valide.");
                    }
                    break;

                case 3:
                    //Logique  quantite de produit
                    const isValidNumber = /^\d+$/.test(userInput.trim());

                    if (!isValidNumber) {
                        await replyToMessage(client, msg, "Veuillez entrer un nombre valide.");
                    } else {
                        const quantity = parseInt(userInput, 10);
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
                    // logique Réception de l'adresse de livraison
                    if (userInput.length <= 60) {
                        orderData[phoneNumber].answers["Location"] = userInput;
                        orderData[phoneNumber].step = Math.floor(orderData[phoneNumber].step) + 1;
                    } else {
                        replyToMessage(client, msg, "Veuillez saisir un nom de quartier valide .");
                    }
                    break; 

                case 5:
                    // Logique pour l'étape recapitulatif
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
                    const mobileMoneyNumber = userInput.trim();
                    if (!/^6[0-9]{8}$/.test(mobileMoneyNumber)) {
                        msg.reply("Numéro de téléphone mobile money invalide. Veuillez saisir un numéro valide.");
                    }
                    else {
                        orderData[phoneNumber].answers["mobileMoneyNumber"] = userInput;
                        orderData[phoneNumber].step++;
                    }
                    break;
                case 7:
                    // Logique pour l'étape finale
                    (orderData[phoneNumber]) = { step: 1, answers: {} };

                    break;
                default:
                    replyToMessage(client, msg, "Étape inconnue.");
                    break;
            }
        }
        await sendStepMessage(client, phoneNumber, orderData[phoneNumber].step);

    } catch (error) {
        await logService.addLog(
            `${error.message}`,
            'orderCommander',
            'error'
        );
    }
};

const steps = [
    { message: async () => { return await generateProductList(); } },
    { message: async () => { return await generateProductType(); } },
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
            const totalPrice = orderData[phoneNumber].answers["Location"] === productsData.location ? product.variation.price * quantity : product?.variation.price * quantity + deliveryFee;
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
            const totalPrice = orderData[phoneNumber].answers["Location"] === productsData.location ? product.price * quantity : product.price * quantity + deliveryFee;
            const user = orderData[phoneNumber].answers["user"];
            const result = await requestPaiement(user, totalPrice, mobileMoneyPhone, product, quantity);
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
