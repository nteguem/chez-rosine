const { MessageMedia } = require('whatsapp-web.js');
const logService = require('../../services/log.service');

// Map pour suivre les conversations ChatGPT avec un timestamp
const chatGPTConversations = new Map();

// Nettoyer les conversations expirées (plus de 5 minutes)
const cleanupExpiredConversations = () => {
  const now = Date.now();
  for (const [key, data] of chatGPTConversations.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      chatGPTConversations.delete(key);
    }
  }
};

// Nettoyer périodiquement (toutes les minutes)
setInterval(cleanupExpiredConversations, 60 * 1000);

const sendWithTyping = async (client, chatId, message, isMedia = false, options = {}) => {
  try {
    const typingDuration = Math.min(5000, message.length * 100);
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping();

    const automatedMessage = `*_[Assistant virtuel]_*\n\n${message}`;

    setTimeout(async () => {
      if (isMedia) {
        await client.sendMessage(chatId, message, options);
      } else {
        await client.sendMessage(chatId, automatedMessage);
      }
    }, typingDuration);
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'sendWithTyping',
      'error'
    );
  }
};

const sendMessageToNumber = async (client, phoneNumber, message) => {
  await sendWithTyping(client, `${phoneNumber}@c.us`, message);
};

const sendMediaToNumber = async (client, phoneNumber, mediaType, mediaBase64, filename, caption = '') => {
  const media = new MessageMedia(mediaType, mediaBase64, filename);
  await sendWithTyping(client, `${phoneNumber}@c.us`, media, true, { caption: caption });
};

const replyToMessage = async (client, message, replyText) => {
  await sendWithTyping(client, message.from, replyText);
};

// Nouvelle fonction pour gérer les messages ChatGPT
const sendToChatGPT = async (client, userPhone, message) => {
  try {
    // Enregistrer la conversation avec un timestamp
    chatGPTConversations.set(userPhone, {
      timestamp: Date.now(),
      waiting: true
    });

    // Envoyer à ChatGPT
    await sendMessageToNumber(client, "18002428478", message);
    
    // Confirmer à l'utilisateur
    return true;
  } catch (error) {
    await logService.addLog(`Erreur envoi ChatGPT: ${error.message}`, 'sendToChatGPT', 'error');
    return false;
  }
};

// Fonction pour gérer les réponses de ChatGPT
const handleChatGPTResponse = async (client, fromNumber, message) => {
  try {
    // Parcourir toutes les conversations en attente
    for (const [userPhone, data] of chatGPTConversations.entries()) {
      if (data.waiting) {
        // Envoyer la réponse à l'utilisateur
        await sendMessageToNumber(client, userPhone, message);
        // Supprimer ou marquer la conversation comme complétée
        chatGPTConversations.delete(userPhone);
        break;
      }
    }
  } catch (error) {
    await logService.addLog(`Erreur réponse ChatGPT: ${error.message}`, 'handleChatGPTResponse', 'error');
  }
};

// Fonction pour vérifier si un numéro est ChatGPT
const isChatGPTNumber = (number) => {
  return number === "18002428478";
};

module.exports = {
  sendMessageToNumber,
  sendMediaToNumber,
  replyToMessage,
  sendToChatGPT,
  handleChatGPTResponse,
  isChatGPTNumber
};