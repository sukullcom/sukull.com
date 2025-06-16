const express = require('express');
const cors = require('cors');
const Iyzipay = require('iyzipay');
const { createClient } = require('@supabase/supabase-js');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PAYMENT_SERVER_PORT || 3001;

// Define schema inline since CommonJS import from TypeScript is complex
const userCreditsSchema = {
  id: 'serial',
  userId: 'text',
  totalCredits: 'integer',
  usedCredits: 'integer', 
  availableCredits: 'integer',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

const creditTransactionsSchema = {
  id: 'serial',
  userId: 'text',
  paymentId: 'text',
  creditsAmount: 'integer',
  totalPrice: 'text',
  currency: 'text',
  status: 'text',
  createdAt: 'timestamp'
};

const paymentLogsSchema = {
  id: 'serial',
  userId: 'text',
  paymentId: 'text',
  requestData: 'jsonb',
  responseData: 'jsonb',
  status: 'text',
  errorCode: 'text',
  errorMessage: 'text',
  createdAt: 'timestamp'
};

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://sukull.com' : 'http://localhost:3000'),
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: false,
        ca: process.env.CA_CERT
      }
    : false
});

// Initialize Iyzico
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization header required' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment server is running',
    timestamp: new Date().toISOString(),
    iyzico: {
      configured: !!iyzipay,
      environment: process.env.IYZICO_BASE_URL || 'sandbox'
    }
  });
});

// Create payment endpoint
app.post('/api/payment/create', authenticateUser, async (req, res) => {
  console.log('=== PAYMENT SERVER CREATE ROUTE HIT ===');
  
  try {
    const user = req.user;
    const { creditsAmount, totalPrice, paymentCard, billingAddress } = req.body;

    // Validate required fields
    if (!creditsAmount || !totalPrice || !paymentCard || !billingAddress) {
      return res.status(400).json({ 
        success: false, 
        message: "Eksik ödeme bilgileri" 
      });
    }

    // Generate unique IDs
    const conversationId = `conv_${user.id}_${Date.now()}`;
    const basketId = `basket_${user.id}_${Date.now()}`;

    // Prepare Iyzico payment request
    const request_data = {
      locale: "tr",
      conversationId: conversationId,
      price: totalPrice.toString(),
      paidPrice: totalPrice.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: paymentCard.cardHolderName,
        cardNumber: paymentCard.cardNumber,
        expireMonth: paymentCard.expireMonth,
        expireYear: paymentCard.expireYear,
        cvc: paymentCard.cvc,
        registerCard: '0'
      },
      buyer: {
        id: user.id,
        name: billingAddress.contactName.split(' ')[0] || 'Unknown',
        surname: billingAddress.contactName.split(' ').slice(1).join(' ') || 'User',
        gsmNumber: billingAddress.phone || '+905350000000',
        email: user.email || 'user@example.com',
        identityNumber: '74300864791', // Test identity number
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: billingAddress.address,
        ip: req.ip || '85.34.78.112', // Use client IP or default for sandbox
        city: billingAddress.city,
        country: billingAddress.country || 'Turkey',
        zipCode: billingAddress.zipCode || '34000'
      },
      shippingAddress: {
        contactName: billingAddress.contactName,
        city: billingAddress.city,
        country: billingAddress.country || 'Turkey',
        address: billingAddress.address,
        zipCode: billingAddress.zipCode || '34000'
      },
      billingAddress: {
        contactName: billingAddress.contactName,
        city: billingAddress.city,
        country: billingAddress.country || 'Turkey',
        address: billingAddress.address,
        zipCode: billingAddress.zipCode || '34000'
      },
      basketItems: [
        {
          id: `credit_${creditsAmount}`,
          name: `${creditsAmount} Ders Kredisi`,
          category1: 'Education',
          category2: 'Credits',
          itemType: 'VIRTUAL',
          price: totalPrice.toString()
        }
      ]
    };

    // Process payment with Iyzico
    const paymentResult = await new Promise((resolve, reject) => {
      iyzipay.payment.create(request_data, (err, result) => {
        if (err) {
          console.error('Iyzico payment error:', err);
          reject(err);
        } else {
          console.log('Iyzico payment result:', result);
          resolve(result);
        }
      });
    });

    // Simple database operations without Drizzle schemas
    const client = await pool.connect();
    
    try {
      // Log the payment attempt
      await client.query(
        `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          user.id,
          paymentResult.paymentId || conversationId,
          JSON.stringify(request_data),
          JSON.stringify(paymentResult),
          paymentResult.status || 'failed',
          paymentResult.errorCode || null,
          paymentResult.errorMessage || null
        ]
      );

      // Check if payment was successful
      if (paymentResult.status === 'success') {
        // Record successful transaction
        await client.query(
          `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [user.id, paymentResult.paymentId, creditsAmount, totalPrice.toString(), 'TRY', 'success']
        );

        // Update user credits
        const existingCredits = await client.query(
          'SELECT * FROM user_credits WHERE user_id = $1',
          [user.id]
        );
        
        if (existingCredits.rows.length > 0) {
          const current = existingCredits.rows[0];
          await client.query(
            `UPDATE user_credits 
             SET total_credits = $1, available_credits = $2, updated_at = NOW() 
             WHERE user_id = $3`,
            [
              current.total_credits + creditsAmount,
              current.available_credits + creditsAmount,
              user.id
            ]
          );
        } else {
          await client.query(
            `INSERT INTO user_credits (user_id, total_credits, used_credits, available_credits, created_at, updated_at) 
             VALUES ($1, $2, 0, $3, NOW(), NOW())`,
            [user.id, creditsAmount, creditsAmount]
          );
        }

        res.json({
          success: true,
          message: `Ödeme başarılı! ${creditsAmount} kredi hesabınıza eklendi.`,
          data: {
            paymentId: paymentResult.paymentId,
            creditsAdded: creditsAmount,
          }
        });
      } else {
        // Record failed transaction
        await client.query(
          `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [user.id, paymentResult.paymentId || conversationId, creditsAmount, totalPrice.toString(), 'TRY', 'failed']
        );

        res.status(400).json({
          success: false,
          message: paymentResult.errorMessage || 'Ödeme başarısız',
          errorCode: paymentResult.errorCode,
        });
      }
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ödeme işlemi sırasında hata oluştu',
      error: error.message || 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://sukull.com' : 'http://localhost';
  console.log(`🚀 Payment server running on port ${PORT}`);
  console.log(`🏥 Health check: ${baseUrl}:${PORT}/health`);
  console.log(`💳 Payment endpoint: ${baseUrl}:${PORT}/api/payment/create`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Iyzico: ${process.env.IYZICO_BASE_URL || 'sandbox'}`);
});
