const Iyzipay = require('iyzipay');

// Create Iyzico instance with environment variables
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

console.log('Testing Iyzico configuration...');
console.log('API Key:', process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st');
console.log('Secret Key:', '***MASKED***');
console.log('URI:', process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com');

// Test data for a minimal payment request
const testRequest = {
  locale: "tr",
  conversationId: 'test_123456789',
  price: '1.00',
  paidPrice: '1.00',
  currency: Iyzipay.CURRENCY.TRY,
  installments: '1',
  basketId: 'test_basket_123',
  paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
  paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
  paymentCard: {
    cardHolderName: 'John Doe',
    cardNumber: '5890040000000016',
    expireMonth: '12',
    expireYear: '25',
    cvc: '123',
    registerCard: '0'
  },
  buyer: {
    id: 'test_user_123',
    name: 'John',
    surname: 'Doe',
    gsmNumber: '+905350000000',
    email: 'john.doe@example.com',
    identityNumber: '74300864791',
    lastLoginDate: '2015-10-05 12:43:35',
    registrationDate: '2013-04-21 15:12:09',
    registrationAddress: 'Test Address',
    ip: '85.34.78.112',
    city: 'Istanbul',
    country: 'Turkey',
    zipCode: '34732'
  },
  shippingAddress: {
    contactName: 'John Doe',
    city: 'Istanbul',
    country: 'Turkey',
    address: 'Test Address',
    zipCode: '34742'
  },
  billingAddress: {
    contactName: 'John Doe',
    city: 'Istanbul',
    country: 'Turkey',
    address: 'Test Address',
    zipCode: '34742'
  },
  basketItems: [
    {
      id: 'test_item_1',
      name: 'Test Credit',
      category1: 'Education',
      category2: 'Credits',
      itemType: 'VIRTUAL',
      price: '1.00'
    }
  ]
};

console.log('\nTesting payment creation...');
iyzipay.payment.create(testRequest, (err, result) => {
  if (err) {
    console.error('Payment test failed:', err);
  } else {
    console.log('Payment test result:', JSON.stringify(result, null, 2));
  }
  process.exit();
}); 