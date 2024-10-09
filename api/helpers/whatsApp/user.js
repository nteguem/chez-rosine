const { menuData } = require("../../data");
const logger = require('../logger');
const { sendMessageToNumber, replyToMessage } = require('./whatsappMessaging');
const { orderCommander, sendStepMessage } = require("./order")
const Steps = {};


// Réinitialiser l'état utilisateur
const reset = (user) => {
  Steps[user.data.phoneNumber] = { currentMenu: "mainMenu" };
};

// Répondre pour les entrées invalides
const replyInvalid = async (msg, client, user, message = "Veuillez choisir une option valide.") => {
  if (user.exist) {
    replyToMessage(client, msg, message);
  }
  if (Steps[user.data.phoneNumber].currentMenu === "mainMenu") {
    await sendMessageToNumber(client, user.data.phoneNumber, menuData(user.data.pseudo, user.exist));
  }
};


// Commandes utilisateur
const UserCommander = async (user, msg, client) => {
  try {
    if (!msg.isGroup) {
      if (!Steps[user.data.phoneNumber]) reset(user);

      if (msg.body === "#") {
        reset(user);
        replyToMessage(client, msg, menuData(user.data.pseudo, user.exist));
        return;
      }
      const { currentMenu } = Steps[user.data.phoneNumber];
      switch (currentMenu) {
        case "mainMenu":
          switch (msg.body) {
            case "1":
              (Steps[user.data.phoneNumber].currentMenu) = "orderMenu";
              await sendStepMessage(client, user.data.phoneNumber, 1);
              break;
            case "2":
              Steps[user.data.phoneNumber].currentMenu = "promotionsMenu";
              replyToMessage(client, msg, "📋 Offres spéciales : 10% sur 30 Nems, livraison gratuite dès 10 000 CFA.");
              break;
            case "3":
              Steps[user.data.phoneNumber].currentMenu = "assistanceMenu";
              replyToMessage(client, msg, "📋 Assistance : contactez-nous au +237 6 79 78 64 60.");
              break;
            default:
              await replyInvalid(msg, client, user);
          }
          break;

        case "orderMenu":
          await orderCommander(user, msg, client)
        case "promotionsMenu":
        case "assistanceMenu":
          await reset(user)
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
