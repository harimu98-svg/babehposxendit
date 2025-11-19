const payments = new Map();

exports.handler = async (event) => {
  console.log('Webhook Received:', event.body);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const webhookData = JSON.parse(event.body);
    console.log('✅ Webhook Data:', webhookData);

    const { external_id, status, amount } = webhookData;

    payments.set(external_id, {
      status: status,
      amount: amount,
      updated_at: new Date().toISOString()
    });

    console.log(`✅ Payment Updated: ${external_id} -> ${status}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};