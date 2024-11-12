const fetch = require('node-fetch');
const logService = require('./log.service');
require('dotenv').config();

const monetbilService = process.env.PAYMENT_SERVICE_ID;
const notify_url = "https://webhook.site/1b970802-6336-4d13-a96e-b5a74823c89d" || "";
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
