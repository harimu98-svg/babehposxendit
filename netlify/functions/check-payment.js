const payments = new Map();

exports.handler = async (event) => {
  const { external_id } = event.queryStringParameters;

  if (!external_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'external_id required' })
    };
  }

  const payment = payments.get(external_id) || { status: 'PENDING' };

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: payment
    })
  };
};
