import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const Iyzipay = require('iyzipay');
const { Pool } = require('pg');

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

export async function POST(request: NextRequest) {
  console.log('=== PAYMENT API ROUTE HIT ===');
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authorization header required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client and verify the user
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { creditsAmount, totalPrice, paymentCard, billingAddress } = body;

    // Validate required fields
    if (!creditsAmount || !totalPrice || !paymentCard || !billingAddress) {
      return NextResponse.json({ 
        success: false, 
        message: "Eksik ödeme bilgileri" 
      }, { status: 400 });
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
        ip: request.ip || '85.34.78.112', // Use client IP or default for sandbox
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
      iyzipay.payment.create(request_data, (err: any, result: any) => {
        if (err) {
          console.error('Iyzico payment error:', err);
          reject(err);
        } else {
          console.log('Iyzico payment result:', result);
          resolve(result);
        }
      });
    });

    // Simple database operations
    const client = await pool.connect();
    
    try {
      // Log the payment attempt
      await client.query(
        `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          user.id,
          (paymentResult as any).paymentId || conversationId,
          JSON.stringify(request_data),
          JSON.stringify(paymentResult),
          (paymentResult as any).status || 'failed',
          (paymentResult as any).errorCode || null,
          (paymentResult as any).errorMessage || null
        ]
      );

      // Check if payment was successful
      if ((paymentResult as any).status === 'success') {
        // Record successful transaction
        await client.query(
          `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [user.id, (paymentResult as any).paymentId, creditsAmount, totalPrice.toString(), 'TRY', 'success']
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

        return NextResponse.json({
          success: true,
          message: `Ödeme başarılı! ${creditsAmount} kredi hesabınıza eklendi.`,
          data: {
            paymentId: (paymentResult as any).paymentId,
            creditsAdded: creditsAmount,
          }
        });
      } else {
        // Record failed transaction
        await client.query(
          `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [user.id, (paymentResult as any).paymentId || conversationId, creditsAmount, totalPrice.toString(), 'TRY', 'failed']
        );

        return NextResponse.json({
          success: false,
          message: (paymentResult as any).errorMessage || 'Ödeme başarısız',
          errorCode: (paymentResult as any).errorCode,
        }, { status: 400 });
      }
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Ödeme işlemi sırasında hata oluştu',
      error: (error as Error).message || 'Unknown error'
    }, { status: 500 });
  }
} 