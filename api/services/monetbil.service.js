const fetch = require('node-fetch');
require('dotenv').config();

const monetbilService = process.env.PAYMENT_SERVICE_ID;
const notify_url = process.env.NOTIFICATION_URL_PAIEMENT || "";
const monetbilUrl = 'https://api.monetbil.com/payment/v1/placePayment/';

const makePayment = async (user, amount, mobileMoneyPhone,product,quantity,location) => {
  const payload = {
    service: monetbilService,
    phonenumber:mobileMoneyPhone,
    amount:1,
    user:`${user.phoneNumber}(Pseudo : ${user.pseudo}) ${location}`,
    first_name:product?.name,
    last_name:quantity,
    email:product?.variation?.price,
    notify_url:notify_url
  };

  try {
    const response = await fetch(monetbilUrl, {
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
    console.error('Error making payment:', error);
  }
};

module.exports = { makePayment };
