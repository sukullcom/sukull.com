const axios = require('axios');

// Test data for API call
const testPaymentData = {
  creditsAmount: 1,
  totalPrice: 500,
  paymentCard: {
    cardHolderName: 'JOHN DOE',
    cardNumber: '5890040000000016',
    expireMonth: '12',
    expireYear: '25',
    cvc: '123'
  },
  billingAddress: {
    contactName: 'John Doe',
    phone: '+905350000000',
    address: 'Test Address Istanbul',
    city: 'Istanbul',
    country: 'Turkey',
    zipCode: '34000'
  }
};

console.log('Testing payment API endpoint...');
console.log('Test data:', JSON.stringify(testPaymentData, null, 2));

// Test the API endpoint
async function testPaymentAPI() {
  try {
    const response = await axios.post('http://localhost:3000/api/payment/create', testPaymentData, {
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need authentication headers
      }
    });

    console.log('API Response:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API Test Failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', error.response?.data);
    console.error('Full Error:', error.message);
  }
}

testPaymentAPI(); 