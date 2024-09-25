const { adminMenuData } = require("../../data");
const logger = require('../logger');
const { sendMessageToNumber } = require('./whatsappMessaging');

let Steps = {};
let name = "";
let description = "";
let totalMembers = 0;

const resetVariables = () => {
  name = "";
  description = "";
  totalMembers = 0;
};

const AdminCommander = async (user, msg, client) => {
  try {
 
  } catch (error) {
    logger(client).error('Erreur rencontrée Admin', error);
    msg.reply(`An internal server error occurred due to an action by administrator : ${user.data.pseudo}. Our team is working on it. \n\n Please type # to return to the main menu.`);
  }
};

module.exports = {
  AdminCommander,
};
