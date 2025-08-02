const express = require('express');
const cors = require('cors');
const Iyzipay = require('iyzipay');
const { createClient } = require('@supabase/supabase-js');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');
const { YtDlp } = require("ytdlp-nodejs");

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.PAYMENT_SERVER_PORT || 3001;

console.log('🚀 Starting payment server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);
console.log('🌐 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔑 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://sukull.com',
      'https://www.sukull.com',
      'http://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean);
    
    console.log('CORS check - Origin:', origin, 'Allowed:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Initialize Supabase client for authentication
let supabase;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️ Supabase credentials missing');
  }
} catch (error) {
  console.error('❌ Supabase initialization error:', error.message);
}

// Initialize database connection
let pool;
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: false,
        ca: process.env.CA_CERT
      }
    : false
});
    console.log('✅ Database pool initialized');
    
    // Test database connection
    pool.connect()
      .then(client => {
        console.log('✅ Database connection test successful');
        client.release();
      })
      .catch(err => {
        console.error('⚠️ Database connection test failed:', err.message);
      });
  } else {
    console.log('⚠️ DATABASE_URL not set - database features disabled');
  }
} catch (error) {
  console.error('❌ Database initialization error:', error.message);
}

// Initialize Iyzico
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication service not available' 
      });
    }

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
  const health = {
    success: true, 
    message: 'Payment server is running',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabase,
      database: !!pool,
      iyzico: !!iyzipay
    },
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  };
  
  console.log('Health check requested:', health);
  res.json(health);
});

// Basic ping endpoint for Railway
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sukull Payment Server',
    status: 'running',
    endpoints: {
      health: '/health',
      ping: '/ping',
      payment: '/api/payment/create'
    },
    timestamp: new Date().toISOString()
  });
});

// Handle preflight requests for payment endpoint
app.options('/api/payment/create', (req, res) => {
  console.log('Preflight request received for /api/payment/create');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Create payment endpoint
app.post('/api/payment/create', authenticateUser, async (req, res) => {
  console.log('=== PAYMENT SERVER CREATE ROUTE HIT ===');
  
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database service not available'
      });
    }

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

// Subscription payment endpoint
app.post('/api/payment/subscribe', authenticateUser, async (req, res) => {
  console.log('📱 Subscription payment request received');
  
  try {
    const { paymentCard, billingAddress } = req.body;
    const user = req.user;

    if (!paymentCard || !billingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Eksik ödeme bilgileri',
      });
    }

    // Subscription details
    const subscriptionAmount = 100; // 100 TL per month
    const conversationId = `sub_${Date.now()}_${user.id}`;
    const basketId = `basket_${conversationId}`;

    const request_data = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: subscriptionAmount.toString(),
      paidPrice: subscriptionAmount.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
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
        ip: req.ip || '85.34.78.112',
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
          id: 'infinite_hearts_subscription',
          name: 'Sonsuz Can - Aylık Abonelik',
          category1: 'Subscription',
          category2: 'Premium',
          itemType: 'VIRTUAL',
          price: subscriptionAmount.toString()
        }
      ]
    };

    // Process payment with Iyzico
    const paymentResult = await new Promise((resolve, reject) => {
      iyzipay.payment.create(request_data, (err, result) => {
        if (err) {
          console.error('Iyzico subscription payment error:', err);
          reject(err);
        } else {
          console.log('Iyzico subscription payment result:', result);
          resolve(result);
        }
      });
    });

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
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

        // Create subscription record
        await client.query(
          `INSERT INTO user_subscriptions (user_id, subscription_type, status, start_date, end_date, payment_id, amount, currency, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [user.id, 'infinite_hearts', 'active', now, endDate, paymentResult.paymentId, subscriptionAmount.toString(), 'TRY']
        );

        // Update user progress with infinite hearts
        await client.query(
          `UPDATE user_progress 
           SET has_infinite_hearts = true, subscription_expires_at = $1 
           WHERE user_id = $2`,
          [endDate, user.id]
        );

        res.json({
          success: true,
          message: 'Sonsuz can aboneliği başarıyla aktifleştirildi! Artık sınırsız kalp kullanabilirsiniz.',
          data: {
            paymentId: paymentResult.paymentId,
            subscriptionType: 'infinite_hearts',
            expiresAt: endDate.toISOString(),
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: paymentResult.errorMessage || 'Abonelik ödemesi başarısız',
          errorCode: paymentResult.errorCode,
        });
      }
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Subscription payment error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Abonelik işlemi sırasında hata oluştu',
      error: error.message || 'Unknown error'
    });
  }
});

// YouTube Transcript API endpoint
app.get('/api/youtube-transcript', async (req, res) => {
  try {
    const { videoId, lang = 'en' } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ 
        error: "Missing videoId parameter." 
      });
    }

    console.log(`Fetching transcript for: ${videoId}, language: ${lang}`);

    const ytdlp = new YtDlp();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Check if yt-dlp is available and download if needed
    const isInstalled = await ytdlp.checkInstallationAsync();
    if (!isInstalled) {
      console.log("Installing yt-dlp...");
    }

    // Get video info including available subtitles
    console.log("Fetching video information...");
    const videoInfo = await ytdlp.getInfoAsync(videoUrl);
    
    if (videoInfo._type !== 'video') {
      return res.status(400).json({
        error: "Invalid video. Please provide a single video URL.",
        videoId: videoId
      });
    }

    // Check for available subtitles
    const subtitles = videoInfo.subtitles || {};
    const automaticCaptions = videoInfo.automatic_captions || {};
    const FALLBACK_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ru', 'it', 'ar', 'tr'];

    console.log("Available subtitles:", Object.keys(subtitles));
    console.log("Available auto-captions:", Object.keys(automaticCaptions));

    // Function to extract transcript from subtitle data
    const extractTranscript = async (langCode, isAutomatic = false) => {
      try {
        const source = isAutomatic ? automaticCaptions : subtitles;
        const langSubs = source[langCode];
        
        if (!langSubs || !Array.isArray(langSubs) || langSubs.length === 0) {
          return null;
        }

        const formats = ['json3', 'srv1', 'vtt', 'ttml'];
        let subtitle = null;

        for (const format of formats) {
          subtitle = langSubs.find((sub) => sub.ext === format);
          if (subtitle) break;
        }

        if (!subtitle) subtitle = langSubs[0];

        console.log(`Fetching ${langCode} ${isAutomatic ? 'auto' : 'manual'} (${subtitle.ext})`);

        // Fetch the subtitle content
        const response = await fetch(subtitle.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const content = await response.text();
        
        // Parse based on format
        let transcript = [];
        
        if (subtitle.ext === 'json3') {
          const data = JSON.parse(content);
          if (data.events) {
            for (const event of data.events) {
              if (event.segs) {
                let text = '';
                for (const seg of event.segs) {
                  if (seg.utf8) {
                    text += seg.utf8;
                  }
                }
                if (text.trim()) {
                  transcript.push({
                    startTime: event.tStartMs / 1000,
                    duration: event.dDurationMs / 1000,
                    text: text.trim()
                  });
                }
              }
            }
          }
        } else if (subtitle.ext === 'vtt') {
          const lines = content.split('\n');
          let currentTime = null;
          let currentText = '';
          
          for (const line of lines) {
            const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
            if (timeMatch) {
              if (currentTime && currentText.trim()) {
                transcript.push({
                  startTime: currentTime,
                  text: currentText.trim()
                });
              }
              // Convert time to seconds
              const [, start] = timeMatch;
              const [hours, minutes, seconds] = start.split(':');
              currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
              currentText = '';
            } else if (line.trim() && !line.startsWith('WEBVTT') && !line.includes('-->')) {
              currentText += line + ' ';
            }
          }
          
          if (currentTime && currentText.trim()) {
            transcript.push({
              startTime: currentTime,
              text: currentText.trim()
            });
          }
        }

        return transcript.length > 0 ? transcript : null;
      } catch (error) {
        console.error(`Error extracting ${langCode} transcript:`, error);
        return null;
      }
    };

    // Try to get transcript in order of preference
    let transcript = null;
    let usedLanguage = null;
    let isAutomatic = false;

    // 1. Try requested language (manual first, then automatic)
    transcript = await extractTranscript(lang, false);
    if (transcript) {
      usedLanguage = lang;
      isAutomatic = false;
    } else {
      transcript = await extractTranscript(lang, true);
      if (transcript) {
        usedLanguage = lang;
        isAutomatic = true;
      }
    }

    // 2. Try fallback languages if requested language failed
    if (!transcript) {
      for (const fallbackLang of FALLBACK_LANGUAGES) {
        if (fallbackLang === lang) continue; // Already tried

        transcript = await extractTranscript(fallbackLang, false);
        if (transcript) {
          usedLanguage = fallbackLang;
          isAutomatic = false;
          break;
        }

        transcript = await extractTranscript(fallbackLang, true);
        if (transcript) {
          usedLanguage = fallbackLang;
          isAutomatic = true;
          break;
        }
      }
    }

    // 3. Try any available language as last resort
    if (!transcript) {
      const allLanguages = [...Object.keys(subtitles), ...Object.keys(automaticCaptions)];
      for (const availableLang of allLanguages) {
        if (FALLBACK_LANGUAGES.includes(availableLang)) continue; // Already tried

        transcript = await extractTranscript(availableLang, false);
        if (transcript) {
          usedLanguage = availableLang;
          isAutomatic = false;
          break;
        }

        transcript = await extractTranscript(availableLang, true);
        if (transcript) {
          usedLanguage = availableLang;
          isAutomatic = true;
          break;
        }
      }
    }

    // If still no transcript found
    if (!transcript || transcript.length === 0) {
      const manual = Object.keys(subtitles);
      const auto = Object.keys(automaticCaptions);
      
      const errorMessage = `Bu video için transcript bulunamadı.\n\nMevcut:\n- Manuel: ${manual.length ? manual.join(', ') : 'Yok'}\n- Otomatik: ${auto.length ? auto.join(', ') : 'Yok'}`;

      return res.status(404).json({
        error: errorMessage,
        videoId: videoId,
        availableSubtitles: manual,
        availableAutoCaptions: auto
      });
    }

    console.log(`Successfully processed transcript: ${transcript.length} lines, language: ${usedLanguage}${isAutomatic ? ' (automatic)' : ''}`);

    res.json({
      transcript,
      language: usedLanguage,
      isAutomatic,
      totalLines: transcript.length,
      duration: transcript.length > 0 ? transcript[transcript.length - 1].startTime : 0,
      videoTitle: videoInfo.title || 'Unknown'
    });

  } catch (error) {
    console.error("yt-dlp error:", error);

    let message = `Hata: ${error.message}`;
    
    if (error.message.includes('Private video')) {
      message = 'Bu video özel. Lütfen halka açık bir video seçin.';
    } else if (error.message.includes('Video unavailable')) {
      message = 'Video erişilebilir değil.';
    }

    res.status(500).json({
      error: message,
      type: "YtDlpError",
      videoId: req.query.videoId
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Payment server running on port ${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`💳 Payment endpoint: http://0.0.0.0:${PORT}/api/payment/create`);
  console.log(`♾️  Subscription endpoint: http://0.0.0.0:${PORT}/api/payment/subscribe`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Iyzico: ${process.env.IYZICO_BASE_URL || 'sandbox'}`);
  console.log(`📊 Services status:`);
  console.log(`   - Supabase: ${supabase ? '✅' : '❌'}`);
  console.log(`   - Database: ${pool ? '✅' : '❌'}`);
  console.log(`   - Iyzico: ${iyzipay ? '✅' : '❌'}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
