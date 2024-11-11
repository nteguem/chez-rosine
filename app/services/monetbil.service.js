const fetch = require('node-fetch');
const logService = require('./log.service');
require('dotenv').config();

const monetbilService = process.env.PAYMENT_SERVICE_ID;
const notify_url = process.env.NOTIFICATION_URL_PAIEMENT || "";
const paiement_url = process.env.PAYMENT_API_ENDPOINT ;

const makePayment = async (user, amount, mobileMoneyPhone,product,quantity,location) => {
  const payload = {
    service: monetbilService,
    phonenumber:mobileMoneyPhone,
    amount:1,
    user:`${user.phoneNumber}(Pseudo : ${user.pseudo}) ${location}`,
    first_name:`${product?.name} ${product?.variation?.name}`,
    last_name:quantity,
    email:product?.variation?.price,
    notify_url
  };

  try {
    console.log("payload",payload)
    const response = await fetch(paiement_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) { 
      console.log(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'makePayment',
      'error'
  );
  }
};

module.exports = { makePayment };
