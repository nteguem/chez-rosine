const { MessageMedia } = require('whatsapp-web.js');
// const logger = require("../logger")

// Utility function to handle typing state and send a message
const sendWithTyping = async (client, chatId, message, isMedia = false, options = {}) => {
    try {
        const typingDuration = Math.min(5000, message.length * 100); // 100ms per character, maximum 5000ms
        const chat = await client.getChatById(chatId); // Retrieve the chat by ID
        await chat.sendStateTyping(); // Indicate that we are typing
        
        // Delay before sending the message or media
        setTimeout(async () => {
            if (isMedia) {
                await client.sendMessage(chatId, message, options); // Send media
            } else {
                await client.sendMessage(chatId, message); // Send text message
            }
        }, typingDuration);
    } catch (error) {
        console.log('Error sending message:', error);
        // logger(client).error('Error sending message:', error);
    }
};

// Function to send a message to a specific number
const sendMessageToNumber = async (client, phoneNumber, message) => {
    await sendWithTyping(client, `${phoneNumber}@c.us`, message);
};

// Function to send media (PDF, image, etc.) to a specific number
const sendMediaToNumber = async (client, phoneNumber, mediaType, mediaBase64, filename, caption = '') => {
    const media = new MessageMedia(mediaType, mediaBase64, filename);
    await sendWithTyping(client, `${phoneNumber}@c.us`, media, true, { caption: caption });
};

// Function to reply to a specific message
const replyToMessage = async (client, message, replyText) => {
    await sendWithTyping(client, message.from, replyText);
};

module.exports = {
    sendMessageToNumber,
    sendMediaToNumber,
    replyToMessage
};
