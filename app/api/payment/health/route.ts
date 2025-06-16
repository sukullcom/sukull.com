import { NextResponse } from 'next/server';

const Iyzipay = require('iyzipay');

// Initialize Iyzico
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Payment API is running',
    timestamp: new Date().toISOString(),
    iyzico: {
      configured: !!iyzipay,
      environment: process.env.IYZICO_BASE_URL || 'sandbox'
    },
    database: {
      configured: !!process.env.DATABASE_URL
    }
  });
} 