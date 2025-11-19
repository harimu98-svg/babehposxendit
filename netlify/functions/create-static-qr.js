exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, customerName } = JSON.parse(event.body);
    
    const netlifyUrl = process.env.URL;
    const callbackURL = `${netlifyUrl}/.netlify/functions/xendit-webhook`;
    
    // Manual API call ke Xendit
    const response = await fetch('https://api.xendit.co/v2/qr_codes', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.XENDIT_TEST_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `static_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'STATIC',
        callback_url: callbackURL,
        metadata: {
          customer_name: customerName,
          amount: amount
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xendit API error');
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          qr_string: data.qr_string,
          external_id: data.external_id,
          amount: amount,
          expires_at: data.expires_at
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};