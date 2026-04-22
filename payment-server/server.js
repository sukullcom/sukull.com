/**
 * Sukull Payment Server (Iyzico + Postgres)
 *
 * Security / correctness guarantees:
 *   - Supabase JWT is verified on every request (no anonymous payments).
 *   - Idempotency: each request requires an `idempotencyKey`; duplicate keys
 *     short-circuit and return the original result (prevents double charges).
 *   - Turkish national ID (TC kimlik) is supplied by the user and validated
 *     before being sent to Iyzico (no hardcoded identity numbers).
 *   - Iyzico's raw error messages are NEVER returned to the client; only a
 *     safe generic Turkish message is surfaced. Full details are logged in
 *     `payment_logs` for admin investigation.
 *   - All DB writes for a successful payment are wrapped in a transaction.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Iyzipay = require("iyzipay");
const { createClient } = require("@supabase/supabase-js");
const { Pool } = require("pg");

const PORT = process.env.PORT || process.env.PAYMENT_SERVER_PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// ---------------------------------------------------------------------------
// Boot logs
// ---------------------------------------------------------------------------
console.log("Starting payment server...");
console.log(`  env: ${NODE_ENV}`);
console.log(`  port: ${PORT}`);
console.log(`  db: ${process.env.DATABASE_URL ? "set" : "MISSING"}`);
console.log(
  `  supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING"}`,
);

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "https://sukull.com",
  "https://www.sukull.com",
  "http://localhost:3000",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(express.json({ limit: "64kb" }));

// ---------------------------------------------------------------------------
// Supabase (auth only)
// ---------------------------------------------------------------------------
let supabase = null;
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  console.log("Supabase client initialized");
} else {
  console.error("Supabase credentials missing - auth will fail");
}

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      NODE_ENV === "production"
        ? { rejectUnauthorized: false, ca: process.env.CA_CERT }
        : false,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
  pool
    .connect()
    .then((c) => {
      console.log("Database pool ok");
      c.release();
    })
    .catch((e) => console.error("Database pool test failed:", e.message));
} else {
  console.error("DATABASE_URL missing - payments will fail");
}

// ---------------------------------------------------------------------------
// Iyzico
// ---------------------------------------------------------------------------
let iyzipay = null;
if (process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY) {
  iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  });
  console.log("Iyzico initialized");
} else {
  console.error("IYZICO_API_KEY/IYZICO_SECRET_KEY missing - payments will fail");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const GENERIC_PAYMENT_ERROR =
  "Ödeme işlenemedi. Lütfen kart bilgilerinizi ve yeterli bakiyenizi kontrol edip tekrar deneyin.";

function isValidTcKimlik(value) {
  if (typeof value !== "string") return false;
  const digits = value.trim();
  if (!/^\d{11}$/.test(digits)) return false;
  if (digits[0] === "0") return false;
  const d = digits.split("").map(Number);
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const tenth = ((oddSum * 7) - evenSum) % 10;
  if ((tenth + 10) % 10 !== d[9]) return false;
  const last = (oddSum + evenSum + d[9]) % 10;
  return last === d[10];
}

function sanitizeCard(card) {
  if (!card) return null;
  return {
    cardHolderName: String(card.cardHolderName || "").trim().slice(0, 100),
    cardNumber: String(card.cardNumber || "").replace(/\D/g, "").slice(0, 19),
    expireMonth: String(card.expireMonth || "").replace(/\D/g, "").slice(0, 2),
    expireYear: String(card.expireYear || "").replace(/\D/g, "").slice(0, 4),
    cvc: String(card.cvc || "").replace(/\D/g, "").slice(0, 4),
    registerCard: "0",
  };
}

function hasValidCard(card) {
  if (!card) return false;
  return (
    card.cardHolderName &&
    card.cardNumber.length >= 13 &&
    card.expireMonth.length === 2 &&
    (card.expireYear.length === 2 || card.expireYear.length === 4) &&
    card.cvc.length >= 3
  );
}

function buildBuyer({ user, address, identityNumber, ip }) {
  const [firstName, ...rest] = String(address.contactName || "")
    .trim()
    .split(/\s+/);
  return {
    id: user.id,
    name: firstName || "Kullanıcı",
    surname: rest.join(" ") || "Sukull",
    gsmNumber: String(address.phone || "+905000000000").slice(0, 20),
    email: user.email || "noreply@sukull.com",
    identityNumber: identityNumber,
    lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    registrationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    registrationAddress: String(address.address || "Türkiye").slice(0, 250),
    ip: ip || "85.34.78.112",
    city: String(address.city || "İstanbul").slice(0, 60),
    country: String(address.country || "Turkey").slice(0, 60),
    zipCode: String(address.zipCode || "34000").slice(0, 20),
  };
}

function buildAddress(address) {
  return {
    contactName: String(address.contactName || "Sukull Kullanıcısı").slice(0, 100),
    city: String(address.city || "İstanbul").slice(0, 60),
    country: String(address.country || "Turkey").slice(0, 60),
    address: String(address.address || "Türkiye").slice(0, 250),
    zipCode: String(address.zipCode || "34000").slice(0, 20),
  };
}

function callIyzicoPayment(request) {
  return new Promise((resolve, reject) => {
    iyzipay.payment.create(request, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function safeLogPayload(request) {
  try {
    const clone = JSON.parse(JSON.stringify(request));
    if (clone.paymentCard) {
      const num = clone.paymentCard.cardNumber || "";
      clone.paymentCard = {
        ...clone.paymentCard,
        cardNumber: num ? `${num.slice(0, 6)}******${num.slice(-4)}` : "",
        cvc: "***",
      };
    }
    if (clone.buyer) {
      clone.buyer = {
        ...clone.buyer,
        identityNumber: clone.buyer.identityNumber ? "***MASKED***" : undefined,
      };
    }
    return clone;
  } catch {
    return { note: "failed to clone payload" };
  }
}

// ---------------------------------------------------------------------------
// DB-based rate limiting (shares `check_rate_limit` with the Next.js app)
// ---------------------------------------------------------------------------
async function checkRateLimit(key, maxAttempts, windowSeconds) {
  if (!pool) return { allowed: true, remaining: maxAttempts, resetAt: new Date() };
  try {
    const { rows } = await pool.query(
      `SELECT allowed, remaining, reset_at
         FROM check_rate_limit($1::text, $2::int, $3::int)`,
      [key, maxAttempts, windowSeconds],
    );
    if (!rows[0]) return { allowed: true, remaining: maxAttempts, resetAt: new Date() };
    return {
      allowed: !!rows[0].allowed,
      remaining: Number(rows[0].remaining ?? 0),
      resetAt: rows[0].reset_at ? new Date(rows[0].reset_at) : new Date(),
    };
  } catch (e) {
    console.error("rate-limit check failed (failing open):", e.message || e);
    return { allowed: true, remaining: maxAttempts, resetAt: new Date() };
  }
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------
async function findIdempotentResult(client, userId, idempotencyKey) {
  const { rows } = await client.query(
    `SELECT status, response_data
       FROM payment_logs
      WHERE user_id = $1 AND payment_id = $2
      LIMIT 1`,
    [userId, idempotencyKey],
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
async function authenticateUser(req, res, next) {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ success: false, message: "Kimlik doğrulama servisi kullanılamıyor." });
    }
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Yetkilendirme başlığı gerekli." });
    }
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res
        .status(401)
        .json({ success: false, message: "Oturumunuz geçersiz veya süresi dolmuş." });
    }
    req.user = data.user;
    next();
  } catch (e) {
    console.error("auth error:", e);
    res
      .status(401)
      .json({ success: false, message: "Kimlik doğrulama başarısız." });
  }
}

// ---------------------------------------------------------------------------
// Health / meta
// ---------------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabase,
      database: !!pool,
      iyzico: !!iyzipay,
    },
    env: NODE_ENV,
  });
});
app.get("/ping", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);
app.get("/", (req, res) =>
  res.json({
    message: "Sukull Payment Server",
    endpoints: ["/health", "/ping", "/api/payment/create", "/api/payment/subscribe"],
  }),
);

// ---------------------------------------------------------------------------
// POST /api/payment/create — credit purchase
// ---------------------------------------------------------------------------
app.post("/api/payment/create", authenticateUser, async (req, res) => {
  if (!pool || !iyzipay) {
    return res
      .status(503)
      .json({ success: false, message: "Ödeme servisi geçici olarak kullanılamıyor." });
  }

  const user = req.user;

  // Rate limit: 5 payment attempts per user / 10 minutes (card-testing protection)
  const rl = await checkRateLimit(`payment:create:${user.id}`, 5, 600);
  if (!rl.allowed) {
    return res.status(429).json({
      success: false,
      message: "Çok fazla ödeme denemesi. Lütfen birkaç dakika sonra tekrar deneyin.",
    });
  }

  const {
    creditsAmount,
    totalPrice,
    paymentCard: rawCard,
    billingAddress,
    identityNumber,
    idempotencyKey,
  } = req.body || {};

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return res.status(400).json({
      success: false,
      message: "Geçersiz istek: idempotency anahtarı eksik.",
    });
  }
  if (!creditsAmount || !totalPrice || !billingAddress) {
    return res.status(400).json({ success: false, message: "Eksik ödeme bilgileri." });
  }
  if (!isValidTcKimlik(identityNumber)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz TC kimlik numarası. Lütfen 11 haneli doğru TC kimlik numarası giriniz.",
    });
  }

  const card = sanitizeCard(rawCard);
  if (!hasValidCard(card)) {
    return res
      .status(400)
      .json({ success: false, message: "Kart bilgileri eksik veya hatalı." });
  }

  const client = await pool.connect();
  try {
    const existing = await findIdempotentResult(client, user.id, idempotencyKey);
    if (existing) {
      const ok = existing.status === "success";
      return res.status(ok ? 200 : 400).json({
        success: ok,
        message: ok
          ? `Ödeme zaten işlenmişti. ${creditsAmount} kredi hesabınızda.`
          : GENERIC_PAYMENT_ERROR,
        idempotent: true,
      });
    }

    const conversationId = idempotencyKey;
    const basketId = `basket_${user.id}_${Date.now()}`;
    const request = {
      locale: "tr",
      conversationId,
      price: totalPrice.toString(),
      paidPrice: totalPrice.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: "1",
      basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: card,
      buyer: buildBuyer({
        user,
        address: billingAddress,
        identityNumber: identityNumber.trim(),
        ip: req.ip,
      }),
      shippingAddress: buildAddress(billingAddress),
      billingAddress: buildAddress(billingAddress),
      basketItems: [
        {
          id: `credit_${creditsAmount}`,
          name: `${creditsAmount} Ders Kredisi`,
          category1: "Education",
          category2: "Credits",
          itemType: "VIRTUAL",
          price: totalPrice.toString(),
        },
      ],
    };

    let paymentResult;
    try {
      paymentResult = await callIyzicoPayment(request);
    } catch (e) {
      console.error("Iyzico error (credit):", e?.message || e);
      await client.query(
        `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          user.id,
          idempotencyKey,
          JSON.stringify(safeLogPayload(request)),
          JSON.stringify({ exception: String(e?.message || e) }),
          "failed",
          "network_error",
          "Iyzico request failed",
        ],
      );
      return res
        .status(502)
        .json({ success: false, message: GENERIC_PAYMENT_ERROR });
    }

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        user.id,
        idempotencyKey,
        JSON.stringify(safeLogPayload(request)),
        JSON.stringify(paymentResult),
        paymentResult.status || "failed",
        paymentResult.errorCode || null,
        paymentResult.errorMessage || null,
      ],
    );

    if (paymentResult.status === "success") {
      await client.query(
        `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          user.id,
          paymentResult.paymentId,
          creditsAmount,
          totalPrice.toString(),
          "TRY",
          "success",
        ],
      );

      const existingCredits = await client.query(
        "SELECT total_credits, available_credits FROM user_credits WHERE user_id = $1 FOR UPDATE",
        [user.id],
      );
      if (existingCredits.rows.length > 0) {
        const cur = existingCredits.rows[0];
        await client.query(
          `UPDATE user_credits
              SET total_credits = $1,
                  available_credits = $2,
                  updated_at = NOW()
            WHERE user_id = $3`,
          [
            cur.total_credits + creditsAmount,
            cur.available_credits + creditsAmount,
            user.id,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO user_credits (user_id, total_credits, used_credits, available_credits, created_at, updated_at)
           VALUES ($1, $2, 0, $3, NOW(), NOW())`,
          [user.id, creditsAmount, creditsAmount],
        );
      }
      await client.query("COMMIT");
      return res.json({
        success: true,
        message: `Ödeme başarılı! ${creditsAmount} kredi hesabınıza eklendi.`,
        data: { paymentId: paymentResult.paymentId, creditsAdded: creditsAmount },
      });
    }

    await client.query(
      `INSERT INTO credit_transactions (user_id, payment_id, credits_amount, total_price, currency, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        user.id,
        paymentResult.paymentId || idempotencyKey,
        creditsAmount,
        totalPrice.toString(),
        "TRY",
        "failed",
      ],
    );
    await client.query("COMMIT");
    return res.status(400).json({ success: false, message: GENERIC_PAYMENT_ERROR });
  } catch (e) {
    console.error("payment/create fatal:", e);
    try {
      await client.query("ROLLBACK");
    } catch {}
    return res
      .status(500)
      .json({ success: false, message: GENERIC_PAYMENT_ERROR });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/payment/subscribe — infinite-hearts monthly subscription
// ---------------------------------------------------------------------------
app.post("/api/payment/subscribe", authenticateUser, async (req, res) => {
  if (!pool || !iyzipay) {
    return res
      .status(503)
      .json({ success: false, message: "Ödeme servisi geçici olarak kullanılamıyor." });
  }

  const user = req.user;

  const rl = await checkRateLimit(`payment:subscribe:${user.id}`, 5, 600);
  if (!rl.allowed) {
    return res.status(429).json({
      success: false,
      message: "Çok fazla ödeme denemesi. Lütfen birkaç dakika sonra tekrar deneyin.",
    });
  }

  const {
    paymentCard: rawCard,
    billingAddress,
    identityNumber,
    idempotencyKey,
  } = req.body || {};

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return res.status(400).json({
      success: false,
      message: "Geçersiz istek: idempotency anahtarı eksik.",
    });
  }
  if (!billingAddress) {
    return res.status(400).json({ success: false, message: "Eksik ödeme bilgileri." });
  }
  if (!isValidTcKimlik(identityNumber)) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz TC kimlik numarası. Lütfen 11 haneli doğru TC kimlik numarası giriniz.",
    });
  }

  const card = sanitizeCard(rawCard);
  if (!hasValidCard(card)) {
    return res
      .status(400)
      .json({ success: false, message: "Kart bilgileri eksik veya hatalı." });
  }

  const subscriptionAmount = 100;

  const client = await pool.connect();
  try {
    const existing = await findIdempotentResult(client, user.id, idempotencyKey);
    if (existing) {
      const ok = existing.status === "success";
      return res.status(ok ? 200 : 400).json({
        success: ok,
        message: ok
          ? "Abonelik zaten aktif edilmişti."
          : GENERIC_PAYMENT_ERROR,
        idempotent: true,
      });
    }

    const conversationId = idempotencyKey;
    const basketId = `basket_${conversationId}`;
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: subscriptionAmount.toString(),
      paidPrice: subscriptionAmount.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: "1",
      basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
      paymentCard: card,
      buyer: buildBuyer({
        user,
        address: billingAddress,
        identityNumber: identityNumber.trim(),
        ip: req.ip,
      }),
      shippingAddress: buildAddress(billingAddress),
      billingAddress: buildAddress(billingAddress),
      basketItems: [
        {
          id: "infinite_hearts_subscription",
          name: "Sonsuz Can - Aylık Abonelik",
          category1: "Subscription",
          category2: "Premium",
          itemType: "VIRTUAL",
          price: subscriptionAmount.toString(),
        },
      ],
    };

    let paymentResult;
    try {
      paymentResult = await callIyzicoPayment(request);
    } catch (e) {
      console.error("Iyzico error (subscribe):", e?.message || e);
      await client.query(
        `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          user.id,
          idempotencyKey,
          JSON.stringify(safeLogPayload(request)),
          JSON.stringify({ exception: String(e?.message || e) }),
          "failed",
          "network_error",
          "Iyzico request failed",
        ],
      );
      return res
        .status(502)
        .json({ success: false, message: GENERIC_PAYMENT_ERROR });
    }

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO payment_logs (user_id, payment_id, request_data, response_data, status, error_code, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        user.id,
        idempotencyKey,
        JSON.stringify(safeLogPayload(request)),
        JSON.stringify(paymentResult),
        paymentResult.status || "failed",
        paymentResult.errorCode || null,
        paymentResult.errorMessage || null,
      ],
    );

    if (paymentResult.status === "success") {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await client.query(
        `INSERT INTO user_subscriptions (user_id, subscription_type, status, start_date, end_date, payment_id, amount, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          user.id,
          "infinite_hearts",
          "active",
          now,
          endDate,
          paymentResult.paymentId,
          subscriptionAmount.toString(),
          "TRY",
        ],
      );
      await client.query(
        `UPDATE user_progress
            SET has_infinite_hearts = true,
                subscription_expires_at = $1
          WHERE user_id = $2`,
        [endDate, user.id],
      );
      await client.query("COMMIT");
      return res.json({
        success: true,
        message: "Sonsuz can aboneliği başarıyla aktifleştirildi!",
        data: {
          paymentId: paymentResult.paymentId,
          subscriptionType: "infinite_hearts",
          expiresAt: endDate.toISOString(),
        },
      });
    }

    await client.query("COMMIT");
    return res.status(400).json({ success: false, message: GENERIC_PAYMENT_ERROR });
  } catch (e) {
    console.error("payment/subscribe fatal:", e);
    try {
      await client.query("ROLLBACK");
    } catch {}
    return res
      .status(500)
      .json({ success: false, message: GENERIC_PAYMENT_ERROR });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Generic error handler
// ---------------------------------------------------------------------------
app.use((error, req, res, _next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: NODE_ENV === "development" ? error.message : "Sunucu hatası",
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

app
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Payment server listening on :${PORT}`);
  })
  .on("error", (err) => {
    console.error("Server startup error:", err);
    process.exit(1);
  });
