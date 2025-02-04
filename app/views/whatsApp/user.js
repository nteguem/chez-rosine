const { menuData } = require("../../data");
const { sendMessageToNumber, replyToMessage,sendToChatGPT } = require('./whatsappMessaging');
const { orderCommander, sendStepMessage } = require("./order");
const logService = require('../../services/log.service');
const userService = require('../../services/user.service')
const Steps = {};

// Réinitialiser l'état utilisateur
const reset = (user) => {
  Steps[user.data.phoneNumber] = { currentMenu: "mainMenu" };
};

// Répondre pour les entrées invalides
const replyInvalid = async (msg, client, user, message = `⚠️ Option non valide : "${msg.body}". Veuillez choisir un numéro entre 1 et 4.\n\n*1. Commander maintenant - tapez 1*\n*2. Promotions et offres spéciales - tapez 2*\n*3. Discuter directement avec un membre de notre équipe - tapez 3*\n*4. Discuter avec ChatGPT - tapez 4*`) => {
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
      // Vérifier si le bot est désactivé
      if (user.data.botStatus === "off") {
        if (msg.body.toLowerCase() === "on") {
          const updateResult = await userService.update(user.data.phoneNumber, { botStatus: "on" });
          if (updateResult.success) {
            user.data.botStatus = "on";
            await replyToMessage(client, msg, "🤖 L'assistant virtuel a été activé avec succès.");
            await reset(user);
            await replyInvalid(msg, client, user);
          } else {
            replyToMessage(client, msg, "⚠️ Une erreur est survenue lors de la mise à jour de vos préférences.");
          }
        }
        return;
      }

      if (!Steps[user.data.phoneNumber]) reset(user);

      if (msg.body === "#") {
        reset(user);
        replyToMessage(client, msg, menuData(user.data.pseudo, user.exist));
        return;
      }

      if (msg.body.toLowerCase() === "off") {
        const updateResult = await userService.update(user.data.phoneNumber, { botStatus: "off" });
        if (updateResult.success) {
          await reset(user);
          replyToMessage(client, msg, "🤖 L'assistant virtuel a été désactivé.");
        } else {
          replyToMessage(client, msg, "⚠️ Une erreur est survenue lors de la mise à jour.");
        }
        return;
      }

      const { currentMenu } = Steps[user.data.phoneNumber];
      switch (currentMenu) {
        case "mainMenu":
          switch (msg.body) {
            case "1":
            case "commande":
              Steps[user.data.phoneNumber].currentMenu = "orderMenu";
              await sendStepMessage(client, user.data.phoneNumber, 1);
              break;
            case "2":
              Steps[user.data.phoneNumber].currentMenu = "promotionsMenu";
              replyToMessage(client, msg, "📋 Offres spéciales : 10% sur 30 Nems, livraison gratuite dès 10 000 CFA.");
              break;
            case "3":
              Steps[user.data.phoneNumber].currentMenu = "assistanceMenu";
              replyToMessage(client, msg, `Salut, ${user.data.pseudo}! Vous pouvez laisser un message ici. 😊`);
              break;
            case "4":
              Steps[user.data.phoneNumber].currentMenu = "chatGPTMenu";
              replyToMessage(client, msg, "🤖 Mode ChatGPT activé. Posez votre question. Pour revenir au menu principal, tapez #");
              break;
            default:
              await replyInvalid(msg, client, user);
          }
          break;

          case "chatGPTMenu":
            if (msg.body === "#") {
              reset(user);
              await replyToMessage(client, msg, menuData(user.data.pseudo, user.exist));
              return;
            }
            
            const sent = await sendToChatGPT(client, user.data.phoneNumber, msg.body);
            if (!sent) {
              await replyToMessage(client, msg, "❌ Erreur lors de l'envoi à ChatGPT.");
            } else {
              await replyToMessage(client, msg, "✅ Message envoyé à ChatGPT, veuillez patienter...");
            }
            break;

        case "orderMenu":
          await orderCommander(user, msg, client);
          break;

        case "promotionsMenu":
          await reset(user);
          break;

        case "assistanceMenu":
          const { users } = await userService.list("admin");
          users.forEach(async (item) => {
            const adminMessage = `Message de ${user.data.pseudo} (${user.data.phoneNumber}):\n\n« ${msg.body} »`;
            await sendMessageToNumber(client, item.phoneNumber, adminMessage);
          });
          break;

        default:
          await replyInvalid(msg, client, user);
      }
    }
  } catch (error) {
    await logService.addLog(`${error.message}`, 'UserCommander', 'error');
  }
};

module.exports = {
  UserCommander,
};