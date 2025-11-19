exports.handler = async (event) => {
  console.log('Function started - Headers:', event.headers);
  console.log('Function started - Body:', event.body);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        })
      };
    }

    const { amount, customerName } = parsedBody;
    
    // Validate required fields
    if (!amount) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Amount is required' 
        })
      };
    }

    // Check if Xendit key exists
    if (!process.env.XENDIT_TEST_SECRET_KEY) {
      console.error('XENDIT_TEST_SECRET_KEY is missing');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Server configuration error - Xendit key missing' 
        })
      };
    }

    const netlifyUrl = process.env.URL;
    const callbackURL = `${netlifyUrl}/.netlify/functions/xendit-webhook`;
    
    console.log('Creating QR with:', { amount, customerName, callbackURL });

    // ✅ CORRECT Xendit API endpoint
    const xenditResponse = await fetch('https://api.xendit.co/qr_codes', {  // ← ✅ ENDPOINT YANG BENAR
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.XENDIT_TEST_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `static_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'STATIC',
        callback_url: callbackURL,
        metadata: {
          customer_name: customerName || 'Customer',
          amount: amount
        }
      })
    });
    
    console.log('Xendit response status:', xenditResponse.status);
    
    const responseData = await xenditResponse.json();
    console.log('Xendit API response:', responseData);

    if (!xenditResponse.ok) {
      throw new Error(`Xendit API error (${xenditResponse.status}): ${responseData.message || JSON.stringify(responseData)}`);
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
          qr_string: responseData.qr_string,
          external_id: responseData.external_id,
          amount: amount,
          expires_at: responseData.expires_at
        }
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check Netlify function logs for more information'
      })
    };
  }
};
