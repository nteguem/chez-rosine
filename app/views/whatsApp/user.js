const { menuData } = require("../../data");
const { sendMessageToNumber, replyToMessage } = require('./whatsappMessaging');
const { orderCommander, sendStepMessage } = require("./order");
const logService = require('../../services/log.service');
const userService = require('../../services/user.service')
const Steps = {};


// Réinitialiser l'état utilisateur
const reset = (user) => {
  Steps[user.data.phoneNumber] = { currentMenu: "mainMenu" };
};

// Répondre pour les entrées invalides
const replyInvalid = async (msg, client, user, message = `⚠️ Option non valide : "${msg.body}". Veuillez choisir un numéro entre 1 et 3.\n\n*1. Commander maintenant - tapez 1*\n*2. Promotions et offres spéciales - tapez 2*\n*3. Discuter directement avec un membre de notre équipe - tapez 3*`) => {
  if (user.exist) {
    replyToMessage(client, msg, message);
  }
  if (Steps[user.data.phoneNumber].currentMenu === "mainMenu" && !user.exist) {
    await sendMessageToNumber(client, user.data.phoneNumber, menuData(user.data.pseudo, user.exist));
  }
};


// Commandes utilisateur
const UserCommander = async (user, msg, client) => {
  try {
    if (!msg.isGroup && !msg.isStatus) {
      if (!Steps[user.data.phoneNumber]) reset(user);
      if (msg.body === "#") {
        reset(user);
        replyToMessage(client, msg, menuData(user.data.pseudo, user.exist));
        return;
      }
        // Gestion des commandes "on" et "off"
        if (msg.body.toLowerCase() === "on" || msg.body.toLowerCase() === "off") {
          const botStatus = msg.body.toLowerCase(); // "on" ou "off"
          const updateResult = await userService.update(user.data.phoneNumber, { botStatus });
  
          if (updateResult.success) {
            const responseMessage = botStatus === "on"
              ? "🤖 L'assistant virtuel a été activé avec succès. Je suis à nouveau disponible pour vous aider !"
              : "🤖 L'assistant virtuel a été désactivé. Vous ne recevrez plus de réponses automatiques jusqu'à réactivation.";
            replyToMessage(client, msg, responseMessage);
  
            // Si le bot est activé, permettre de continuer la conversation
            if (botStatus === "on") {
              user.data.botStatus = "on"; // Mettre à jour localement pour continuer la logique
            } else {
              return; // Si désactivé, arrêter ici
            }
          } else {
            replyToMessage(client, msg, "⚠️ Une erreur est survenue lors de la mise à jour de vos préférences. Veuillez réessayer.");
            return;
          }
        }
  
        // Vérifier si le bot est désactivé
        if (user.data.botStatus === "off") {
          replyToMessage(client, msg, "🤖 L'assistant virtuel est désactivé. Tapez *on* pour le réactiver.");
          return; // Si désactivé, ne pas continuer la logique
        }
      }
      const { currentMenu } = Steps[user.data.phoneNumber];
      switch (currentMenu) {
        case "mainMenu":
          switch (msg.body) {
            case "1":
            case "commande":
              (Steps[user.data.phoneNumber].currentMenu) = "orderMenu";
              await sendStepMessage(client, user.data.phoneNumber, 1);
              break;
            case "2":
              Steps[user.data.phoneNumber].currentMenu = "promotionsMenu";
              replyToMessage(client, msg, "📋 Offres spéciales : 10% sur 30 Nems, livraison gratuite dès 10 000 CFA.");
              break;
            case "3":
              Steps[user.data.phoneNumber].currentMenu = "assistanceMenu";
              replyToMessage(client, msg, `Salut, ${user.data.pseudo}! Vous pouvez laisser un message ici, et un membre de notre équipe vous répondra dans les minutes qui suivent. Merci de votre patience ! 😊 \n\n_Si vous souhaitez à tout moment reprendre la conversation avec notre assistant virtuel 🤖, tapez #._`);
              break;
            default:
              await replyInvalid(msg, client, user);
          }
          break;

        case "orderMenu":
          await orderCommander(user, msg, client)
          break;
        case "promotionsMenu":
          await reset(user)
          break;
        case "assistanceMenu":
          const { users } = await userService.list("admin")
          users.forEach(async (item, index) => {
            const adminMessage = `Salut ${item.pseudo},\n\nUn utilisateur de "Des Bons Plats" (WhatsApp : ${user.data.phoneNumber}, Pseudo : ${user.data.pseudo}) souhaite entrer directement en contact avec vous.\n\nVoici le message qu'il a laissé :\n\n« ${msg.body} »\n\nDès que possible, merci de répondre rapidement à cet utilisateur via le numéro WhatsApp associé à "Des Bons Plats". 😊\n\nBonne journée !`;
            await sendMessageToNumber(client, item.phoneNumber, adminMessage);
          });
          break;
        default:
          await replyInvalid(msg, client, user);
      }
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'UserCommander',
      'error'
    );
  }
};

module.exports = {
  UserCommander,
};
