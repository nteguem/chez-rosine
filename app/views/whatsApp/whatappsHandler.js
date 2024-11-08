const { Client, LocalAuth } = require('whatsapp-web.js');
const { save } = require('../../services/user.service');
const { UserCommander } = require("./user");
const { AdminCommander } = require("./admin")
const logService = require('../../services/log.service');

const initializeWhatsAppClient = (io) => {
  const puppeteerConfig = {
    args: ['--no-sandbox'],
  };
  // Add executablePath only on Linux
  if (process.platform === 'linux') {
    puppeteerConfig.executablePath = '/usr/bin/google-chrome-stable';
  }

  const client = new Client({
    puppeteer: puppeteerConfig,
    authStrategy: new LocalAuth({
      dataPath: '../sessions/les-bons-plats',
    }),
  });

  client.on('qr', (qrCode) => {
    io.emit('qrCode', qrCode);
  });

  client.on('authenticated', () => {
    io.emit('qrCode', "");
    console.log('Client is authenticated');
  });

  client.on('ready', () => {
    console.log('Client is ready');
    io.emit('numberBot', `${client.info?.wid?.user} (${client.info?.pushname})`);
    io.emit('qrCode', "connected");
  });

  client.on('disconnected', () => {
    io.emit('qrCode', "disconnected");
    io.emit('numberBot', "");
    // Sauvegarde de la session localement avant de réinitialiser
    client.authInfo && client.authInfo.saveSession && client.authInfo.saveSession();
    client.initialize();
  });

  return client;
};

const handleIncomingMessages = (client) => {
  client.on('message', async (msg) => {
    const contact = await msg.getContact();
    const response = await save(contact.number, contact.pushname);
    try {
      if (response?.data?.role == "user") {
        await UserCommander(response, msg, client);
      }
      else if (response?.data?.role == "admin") {
        await AdminCommander(response, msg, client)
      }
      else {
        msg.reply(response.message)
      }
    }
    catch (err) {
      await logService.addLog(
        `${error.message}`,
        'handleIncomingMessages',
        'error'
      );
    }
  });
};

module.exports = {
  initializeWhatsAppClient,
  handleIncomingMessages
};
