# 🧪 Authentication Testing Guide
## Complete Testing Checklist for Sukull.com

---

## ⚡ Quick Start Testing (5 minutes)

### Test 1: Sign Up Flow
```bash
1. Go to http://localhost:3000/create-account
2. Enter:
   - Username: testuser1
   - Email: your+test1@gmail.com
   - Password: Test123456
   - Confirm Password: Test123456
3. Click "E-posta İle Kayıt Ol"
4. ✅ Check: Success message appears
5. ✅ Check: Redirected to /login
6. Open email inbox
7. ✅ Check: Verification email received
8. Click verification link
9. ✅ Check: Redirected to /login with success message
10. Login with same credentials
11. ✅ Check: Redirected to /courses
```

### Test 2: Login Flow
```bash
1. Go to http://localhost:3000/login
2. Enter your existing account credentials
3. Click "E-posta İle Gİrİş"
4. ✅ Check: Redirected to /courses
5. ✅ Check: User profile displayed correctly
```

### Test 3: Google OAuth
```bash
1. Go to http://localhost:3000/login
2. Click "Google ile devam et"
3. Select your Google account
4. Approve permissions
5. ✅ Check: Redirected to /courses
6. ✅ Check: Profile created with Google name/avatar
```

---

## 🔍 Comprehensive Testing (30 minutes)

### 1️⃣ Sign Up Tests

#### Test 1.1: Valid Signup
- **Input:** Valid username, email, password
- **Expected:** Success message, verification email sent
- **Result:** ✅ / ❌

#### Test 1.2: Duplicate Email
- **Input:** Already registered email
- **Expected:** Error message "Bu e-posta adresi zaten kullanılıyor"
- **Result:** ✅ / ❌

#### Test 1.3: Weak Password
- **Input:** Password less than 6 characters
- **Expected:** Error message "Şifreniz en az 6 karakter olmalıdır"
- **Result:** ✅ / ❌

#### Test 1.4: Password Mismatch
- **Input:** Password ≠ Confirm Password
- **Expected:** Error message "Şifreler eşleşmiyor"
- **Result:** ✅ / ❌

#### Test 1.5: Missing Username
- **Input:** Empty username field
- **Expected:** Error message "Lütfen bir kullanıcı adı giriniz"
- **Result:** ✅ / ❌

#### Test 1.6: Invalid Email Format
- **Input:** "notanemail"
- **Expected:** Browser validation or error message
- **Result:** ✅ / ❌

---

### 2️⃣ Login Tests

#### Test 2.1: Valid Login
- **Input:** Correct email + password
- **Expected:** Redirect to /courses, session created
- **Result:** ✅ / ❌

#### Test 2.2: Invalid Credentials
- **Input:** Wrong password
- **Expected:** Error message "Geçersiz e-posta veya şifre"
- **Result:** ✅ / ❌

#### Test 2.3: Unverified Email
- **Input:** Unverified account credentials
- **Expected:** Error message "Lütfen giriş yapmadan önce e-postanızı doğrulayınız"
- **Result:** ✅ / ❌

#### Test 2.4: Already Logged In
- **Action:** Visit /login while logged in
- **Expected:** Redirect to /courses
- **Result:** ✅ / ❌

---

### 3️⃣ Email Verification Tests

#### Test 3.1: Fresh Verification Link
- **Action:** Click verification link from signup email
- **Expected:** Success message, redirect to /login
- **Result:** ✅ / ❌

#### Test 3.2: Expired Verification Link
- **Action:** Click link after 24+ hours
- **Expected:** Error message, option to resend
- **Result:** ✅ / ❌

#### Test 3.3: Resend Verification
- **Input:** Enter unverified email at /resend-verification
- **Expected:** New verification email sent
- **Result:** ✅ / ❌

---

### 4️⃣ Password Reset Tests

#### Test 4.1: Valid Reset Request
- **Input:** Registered email at /forgot-password
- **Expected:** Success message "If an account exists..."
- **Result:** ✅ / ❌

#### Test 4.2: Check Email Received
- **Action:** Check inbox after reset request
- **Expected:** Password reset email received
- **Result:** ✅ / ❌

#### Test 4.3: Click Reset Link
- **Action:** Click reset link from email
- **Expected:** Redirect to /reset-password
- **Result:** ✅ / ❌

#### Test 4.4: Valid Password Reset
- **Input:** New password (8+ chars) + confirmation
- **Expected:** Success, redirect to /login
- **Result:** ✅ / ❌

#### Test 4.5: Password Mismatch
- **Input:** Password ≠ Confirm Password
- **Expected:** Error message "Şifreler eşleşmiyor"
- **Result:** ✅ / ❌

#### Test 4.6: Weak Password
- **Input:** Password < 8 characters
- **Expected:** Error message "Şifre en az 8 karakter olmalıdır"
- **Result:** ✅ / ❌

#### Test 4.7: Expired Reset Link
- **Action:** Click old reset link
- **Expected:** Error message, redirect to /forgot-password
- **Result:** ✅ / ❌

#### Test 4.8: OAuth Account Reset Attempt
- **Input:** Google account email at /forgot-password
- **Expected:** Silent success (doesn't reveal OAuth user)
- **Result:** ✅ / ❌

---

### 5️⃣ Google OAuth Tests

#### Test 5.1: First-Time OAuth Login
- **Action:** Click Google button, approve
- **Expected:** Account created, redirect to /courses
- **Result:** ✅ / ❌

#### Test 5.2: Check Profile Creation
- **Action:** Check profile after OAuth login
- **Expected:** Name and avatar from Google
- **Result:** ✅ / ❌

#### Test 5.3: Returning OAuth User
- **Action:** Login with Google again
- **Expected:** Same account, no duplicate
- **Result:** ✅ / ❌

#### Test 5.4: OAuth Cancel
- **Action:** Click Google, then cancel
- **Expected:** Return to login page
- **Result:** ✅ / ❌

---

### 6️⃣ Session Management Tests

#### Test 6.1: Protected Route Access
- **Action:** Visit /courses without login
- **Expected:** Redirect to /login with ?next parameter
- **Result:** ✅ / ❌

#### Test 6.2: Logout
- **Action:** Click logout button
- **Expected:** Session cleared, redirect to /login
- **Result:** ✅ / ❌

#### Test 6.3: Logout Verification
- **Action:** After logout, try to access /courses
- **Expected:** Redirect to /login
- **Result:** ✅ / ❌

#### Test 6.4: Browser Back After Logout
- **Action:** Logout, then click browser back button
- **Expected:** Still logged out, can't access protected routes
- **Result:** ✅ / ❌

#### Test 6.5: Multiple Tabs
- **Action:** Login in Tab 1, then access site in Tab 2
- **Expected:** Tab 2 also shows logged in state
- **Result:** ✅ / ❌

#### Test 6.6: Session Persistence
- **Action:** Login, close browser, reopen
- **Expected:** Still logged in (if "remember me" enabled)
- **Result:** ✅ / ❌

---

### 7️⃣ Security Tests

#### Test 7.1: CSRF Protection
- **Action:** Inspect auth requests
- **Expected:** CSRF token present (handled by Supabase)
- **Result:** ✅ / ❌

#### Test 7.2: Email Enumeration Prevention
- **Input:** Unknown email at /forgot-password
- **Expected:** Same message as known email (doesn't reveal existence)
- **Result:** ✅ / ❌

#### Test 7.3: Password Not in URL
- **Action:** Inspect URL during login/signup
- **Expected:** No password in URL or query params
- **Result:** ✅ / ❌

#### Test 7.4: Session Cookie Security
- **Action:** Inspect cookies in DevTools
- **Expected:** HttpOnly, Secure (in production), SameSite flags
- **Result:** ✅ / ❌

#### Test 7.5: XSS Protection Headers
- **Action:** Check response headers
- **Expected:** X-XSS-Protection, CSP headers present
- **Result:** ✅ / ❌

---

### 8️⃣ Error Handling Tests

#### Test 8.1: Network Interruption
- **Action:** Start login, disable network
- **Expected:** Error message displayed
- **Result:** ✅ / ❌

#### Test 8.2: Supabase Down
- **Action:** Simulate Supabase unavailability
- **Expected:** Graceful error message
- **Result:** ✅ / ❌

#### Test 8.3: Invalid Callback Code
- **Action:** Visit /api/auth/callback with invalid code
- **Expected:** Redirect to /auth-error
- **Result:** ✅ / ❌

---

### 9️⃣ UX/UI Tests

#### Test 9.1: Loading States
- **Action:** Observe during login/signup
- **Expected:** Loading spinner, disabled button
- **Result:** ✅ / ❌

#### Test 9.2: Error Messages
- **Action:** Trigger various errors
- **Expected:** Turkish error messages, toast notifications
- **Result:** ✅ / ❌

#### Test 9.3: Success Feedback
- **Action:** Complete signup/login
- **Expected:** Success toast, smooth redirect
- **Result:** ✅ / ❌

#### Test 9.4: Form Validation
- **Action:** Submit empty form
- **Expected:** Browser validation or inline errors
- **Result:** ✅ / ❌

#### Test 9.5: Responsive Design
- **Action:** Test on mobile screen size
- **Expected:** Forms work well on small screens
- **Result:** ✅ / ❌

---

### 🔟 Edge Cases

#### Test 10.1: Rapid Submissions
- **Action:** Click submit button multiple times rapidly
- **Expected:** Only one request sent (button disabled)
- **Result:** ✅ / ❌

#### Test 10.2: Special Characters in Password
- **Input:** Password with !@#$%^&*()
- **Expected:** Accepted and works
- **Result:** ✅ / ❌

#### Test 10.3: Very Long Username
- **Input:** Username > 50 characters
- **Expected:** Validation error or truncation
- **Result:** ✅ / ❌

#### Test 10.4: SQL Injection Attempt
- **Input:** Email: admin'--
- **Expected:** No SQL injection (Supabase handles this)
- **Result:** ✅ / ❌

#### Test 10.5: Unicode Characters
- **Input:** Username: "测试用户"
- **Expected:** Accepted and stored correctly
- **Result:** ✅ / ❌

---

## 📊 Test Results Summary

### Overall Statistics
- **Total Tests:** 50
- **Passed:** ___ / 50
- **Failed:** ___ / 50
- **Pass Rate:** ___%

### Critical Tests Status
- [ ] Sign Up with Email Verification
- [ ] Login with Valid Credentials
- [ ] Google OAuth Login
- [ ] Password Reset Flow
- [ ] Logout and Session Clearing
- [ ] Protected Route Access Control

### Must-Fix Issues
1. ___________
2. ___________
3. ___________

### Nice-to-Fix Issues
1. ___________
2. ___________

---

## 🚀 Quick Testing Commands

### Test with cURL

```bash
# Check auth status
curl http://localhost:3000/api/auth/status

# Test logout endpoint
curl -X POST http://localhost:3000/api/auth/logout
```

### Test with Browser DevTools

```javascript
// Check session in console
const { data, error } = await (await fetch('/api/auth/status')).json()
console.log('Auth Status:', data)

// Check cookies
console.log('Cookies:', document.cookie)

// Trigger logout
await fetch('/api/auth/logout', { method: 'POST' })
```

---

## 📧 Email Testing Tips

### Using Gmail Plus Addressing
```
your+test1@gmail.com
your+test2@gmail.com
your+test3@gmail.com
```
All emails go to `your@gmail.com` but are treated as different accounts.

### Using Temporary Email Services
- https://temp-mail.org
- https://10minutemail.com
- https://guerrillamail.com

### Checking Spam Folder
- Always check spam folder for verification emails
- Mark as "Not Spam" if found there
- Add sender to contacts

---

## 🐛 Common Issues and Solutions

### Issue: Verification Email Not Received
**Solutions:**
1. Check spam folder
2. Wait 5 minutes (email delays)
3. Check Supabase email settings
4. Try resend verification
5. Check email provider blocks

### Issue: OAuth Redirect Fails
**Solutions:**
1. Check Supabase OAuth redirect URLs
2. Verify Google OAuth credentials
3. Check CSP headers allow Google domains
4. Clear browser cache

### Issue: Session Not Persisting
**Solutions:**
1. Check cookie settings (HttpOnly, Secure)
2. Verify domain matches
3. Check browser cookie settings
4. Try incognito mode

### Issue: "Email Already Registered" but Can't Login
**Solutions:**
1. Check if account is OAuth vs email
2. Try password reset
3. Check if email is verified
4. Contact support to check database

---

## ✅ Production Readiness Checklist

### Before Going Live
- [ ] All 50 tests passed
- [ ] Email deliverability tested with real domains
- [ ] Google OAuth configured with production URLs
- [ ] Error tracking setup (Sentry, LogRocket, etc.)
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] SSL/HTTPS enabled
- [ ] Backup email service configured
- [ ] Account recovery process documented
- [ ] Support team trained on common issues

### Monitoring Setup
- [ ] Track failed login attempts
- [ ] Monitor signup conversion rate
- [ ] Track email verification rate
- [ ] Monitor OAuth success rate
- [ ] Alert on high error rates

---

**Testing Completed By:** ___________  
**Date:** ___________  
**Status:** ✅ Ready for Production / ⚠️ Needs Fixes / ❌ Not Ready

