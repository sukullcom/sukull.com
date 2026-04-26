# Payment System Implementation

This document describes the credit-based payment system implemented using Iyzico for the education platform.

## Overview

The platform uses a credit-based system where students must purchase "credits" to book private lessons. Each lesson booking consumes 1 credit.

### Key Features

- **Credit Purchase**: Students can buy credit packages (1, 4, 8, 12 credits)
- **Secure Payments**: Integrated with Iyzico (Turkey-based payment provider)
- **Credit Management**: Automatic credit deduction when booking lessons
- **Transaction Logging**: Complete audit trail of all payments and transactions
- **Responsive UI**: Modern payment form with validation

## System Architecture

### Database Tables

1. **user_credits**: Stores total and available credits per user
   - `total_credits`: Total credits ever purchased
   - `used_credits`: Credits consumed for bookings
   - `available_credits`: Credits available for use

2. **credit_transactions**: Transaction log for credit purchases
   - Records payment details and status
   - Links to Iyzico payment ID

3. **payment_logs**: Raw Iyzico API responses for debugging
   - Stores complete request/response data
   - Error tracking and audit trail

### API Endpoints

- `POST /api/payment/create`: Process credit purchases via Iyzico
- `GET /api/user/credits`: Fetch user's current credit balance
- `POST /api/private-lesson/book-lesson`: Book lessons (now requires credits)

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Iyzico Payment Settings (Sandbox)
IYZICO_API_KEY=sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st
IYZICO_SECRET_KEY=sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Configuration

For production, replace sandbox credentials with live Iyzico credentials:
- Change URL to `https://api.iyzipay.com`
- Use production API key and secret key from Iyzico dashboard

## Usage

### For Students

1. **Navigate to Credits Page**: Click "Krediler" in the sidebar
2. **Select Package**: Choose from 1, 4, 8, or 12 credit packages
3. **Enter Payment Details**: Fill out card information and billing address
4. **Complete Purchase**: Click "Öde" to process payment
5. **Book Lessons**: Use credits to reserve private lessons

### For Developers

#### Testing Payments

Use the test card number provided by Iyzico:
- **Card Number**: `5890040000000016`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **Cardholder**: Any name

#### Running Tests

```bash
# Test Iyzico configuration
node scripts/test-payment.js

# Run development server
npm run dev

# Navigate to http://localhost:3000/credits
```

## Credit Packages & Pricing

| Package | Credits | Price (₺) | Price per Credit |
|---------|---------|-----------|------------------|
| Basic   | 1       | 500       | 500₺            |
| Popular | 4       | 2,000     | 500₺            |
| Value   | 8       | 3,800     | 475₺            |
| Premium | 12      | 5,400     | 450₺            |

## Payment Flow

### 1. User Interaction
- User selects credit package
- Fills payment form with card details and billing address
- Submits payment request

### 2. Backend Processing
- Validates form data and user authentication
- Creates Iyzico payment request with user details
- Processes payment through Iyzico API

### 3. Success Handling
- Logs successful transaction
- Updates user credit balance
- Notifies user of successful purchase

### 4. Error Handling
- Logs failed transactions
- Provides user-friendly error messages
- Maintains data consistency

## Security Features

- **Input Validation**: All payment data is validated
- **Secure API**: Payment processing happens server-side
- **Audit Trail**: Complete logging of all transactions
- **Error Handling**: Graceful handling of payment failures
- **Data Protection**: Sensitive data is not stored locally

## Integration with Lesson Booking

The existing lesson booking system has been enhanced to:
- Check for available credits before allowing bookings
- Automatically deduct 1 credit upon successful booking
- Display credit requirements to users
- Prevent bookings without sufficient credits

## Troubleshooting

### Common Issues

1. **Payment Fails**: Check Iyzico credentials and network connectivity
2. **Credits Not Added**: Check payment logs for transaction status
3. **Booking Fails**: Verify user has sufficient credits

### Debug Tools

- Payment logs in database
- Browser console for frontend errors
- Server logs for API issues
- Test script for Iyzico connectivity

## File Structure

```
components/
  credit-purchase.tsx     # Main payment component
  sidebar.tsx            # Updated with credits link

app/
  api/
    payment/
      create/route.ts    # Payment processing endpoint
    user/
      credits/route.ts   # Credit balance endpoint
  (main)/
    credits/page.tsx     # Credits page

db/
  schema.ts             # Database schema with credit tables
  queries.ts            # Credit-related database functions
  migrations/
    0005_add_credit_system.sql  # Database migration

scripts/
  test-payment.js       # Iyzico test script
```

## Support

For issues related to:
- **Iyzico Integration**: Check Iyzico documentation at https://docs.iyzico.com/
- **Database Issues**: Review migration files and schema
- **Frontend Issues**: Check browser console and component state
- **API Issues**: Review server logs and endpoint implementations 