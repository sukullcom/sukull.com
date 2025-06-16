import { NextResponse } from 'next/server';

// Define interface for type safety
interface IyzipayInstance {
  // Add basic properties that we might need for health check
  apiKey?: string;
  secretKey?: string;
  uri?: string;
}

// Initialize Iyzico dynamically to avoid build issues
let iyzipay: IyzipayInstance | null = null;

async function getIyzipay(): Promise<IyzipayInstance | null> {
  if (!iyzipay) {
    try {
      const Iyzipay = (await import('iyzipay')).default;
      iyzipay = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st',
        secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM',
        uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
      });
    } catch (error) {
      console.error('Failed to initialize Iyzipay:', error);
      return null;
    }
  }
  return iyzipay;
}

export async function GET() {
  const iyzipayInstance = await getIyzipay();
  
  return NextResponse.json({ 
    success: true, 
    message: 'Payment API is running',
    timestamp: new Date().toISOString(),
    iyzico: {
      configured: !!iyzipayInstance,
      environment: process.env.IYZICO_BASE_URL || 'sandbox'
    },
    database: {
      configured: !!process.env.DATABASE_URL
    }
  });
} 