const Xendit = require('xendit-node');

exports.handler = async (event) => {
  const xendit = new Xendit({
    secretKey: process.env.XENDIT_TEST_SECRET_KEY
  });

  try {
    const { amount, customerName } = JSON.parse(event.body);
    
    const netlifyUrl = process.env.URL;
    const callbackURL = `${netlifyUrl}/.netlify/functions/xendit-webhook`;

    const qrCode = await xendit.QRCode.createCode({
      externalID: `static_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'STATIC',
      callbackURL: callbackURL,
      metadata: {
        customer_name: customerName,
        amount: amount
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          qr_string: qrCode.qr_string,
          external_id: qrCode.external_id,
          amount: amount,
          expires_at: qrCode.expires_at
        }
      })
    };
  } catch (error) {
    console.error('Xendit Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
