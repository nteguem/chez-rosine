const fetch = require('node-fetch');
const logService = require('./log.service');
const { createTransaction } = require("./transaction.service");
require('dotenv').config();

const monetbilService = process.env.PAYMENT_SERVICE_ID;
const notify_url = process.env.NOTIFICATION_URL_PAIEMENT || "";
const paiement_url = process.env.PAYMENT_API_ENDPOINT;

const makePayment = async (user, amount, mobileMoneyPhone, product, quantity, location, client) => {
  const payload = {
    service: monetbilService,
    phonenumber: mobileMoneyPhone,
    amount:1,
    item_ref: JSON.stringify({
      product: product,
      user: user,
      quantity,
      location
    }),
    notify_url
  };

  try {
    const response = await fetch(paiement_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.log(`HTTP error! status: ${response.status}`);
      throw new Error(`Payment API returned status ${response.status}`);
    }

    const data = await response.json();

    const transactionPayload = {
      paymentId:data.paymentId,
      status:data.status,
      paymentMethod:data.channel,
      amount:payload.amount,
      phoneNumber:payload.phonenumber,
      notifyUrl:payload.notify_url,
      type:'MONETBIL'
    };

    await createTransaction(transactionPayload);

    return data;
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'makePayment',
      'error'
    );
    throw error; 
  }
};

module.exports = { makePayment };
