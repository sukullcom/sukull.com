# 🧪 Test Password Reset - Debugging Guide

## What I Just Fixed

### Problem
When clicking the password reset link, you were being logged in and redirected to `/courses` instead of `/reset-password`.

### Root Cause (THE REAL ISSUE!) 🎯
The middleware was redirecting authenticated users away from `/reset-password`!

**The flow was:**
1. ✅ Click reset link
2. ✅ Callback establishes session
3. ✅ Redirects to `/reset-password`
4. ❌ **Middleware sees session + `/reset-password` in publicPaths**
5. ❌ **Middleware redirects to `/learn` (then to `/courses`)**

This happened because the middleware has this logic:
```typescript
if (session && publicPaths.some(path => pathname === path)) {
  return NextResponse.redirect(new URL('/learn', req.url))
}
```

**The problem:** Password reset REQUIRES a session to work, but the middleware was treating it like `/login` (which you shouldn't access when logged in).

### Solution - Two Fixes Applied

#### Fix 1: Exclude `/reset-password` from middleware redirect
**File:** `middleware.ts`

```typescript
if (session && publicPaths.some(path => pathname === path)) {
  // EXCEPTION: Allow access to /reset-password even when logged in
  // (password reset REQUIRES a session to work)
  if (pathname === '/reset-password') {
    return response;
  }
  
  // Already logged in => redirect to /learn
  return NextResponse.redirect(new URL('/learn', req.url))
}
```

#### Fix 2: Explicitly include `type=recovery` parameter
**File:** `utils/auth.ts`

```typescript
// Added type=recovery to ensure detection
const resetLink = `${location.origin}/api/auth/callback?type=recovery&next=/reset-password`
```

#### Fix 3: Improved callback detection
**File:** `app/api/auth/callback/route.ts`

- Check for password recovery BEFORE other logic
- Added comprehensive logging
- Improved detection logic

---

## Testing Steps

### Step 1: Restart Your Dev Server ⚠️
**This is critical!**

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 2: Request a New Password Reset

1. Go to: `http://localhost:3000/forgot-password`
2. Enter your email (must be an email account, not Google OAuth)
3. Click "Şİfre Sıfırlama E-postası Gönder"
4. Wait for success message

### Step 3: Check Your Email

Look for the password reset email. The link should look something like:
```
https://YOUR_PROJECT.supabase.co/auth/v1/verify?
  token=xxxxxxxxxx&
  type=recovery&
  redirect_to=http://localhost:3000/api/auth/callback?type=recovery&next=/reset-password
```

Notice: `type=recovery` appears TWICE:
- Once from Supabase
- Once in our redirect URL (this is the important one!)

### Step 4: Click the Reset Link

**What should happen:**

1. ✅ Opens in browser
2. ✅ Goes to Supabase verification endpoint
3. ✅ Supabase validates token
4. ✅ Redirects to: `http://localhost:3000/api/auth/callback?code=xxx&type=recovery&next=/reset-password`
5. ✅ Callback exchanges code for session
6. ✅ Detects password recovery via `type=recovery` parameter
7. ✅ Redirects to: `http://localhost:3000/reset-password`
8. ✅ Shows password reset form

**What should NOT happen:**
- ❌ Redirect to `/courses`
- ❌ Redirect to `/learn`
- ❌ Show "logged in" state

### Step 5: Check Browser Console

Open Developer Tools (F12) and look at the Console tab. You should see:

```
OAuth/Email verification callback received: { url: '...', hasCode: true, error: 'none' }
Exchanging code for session...
Session created successfully for user: [user-id]
Password recovery check: {
  type: 'recovery',
  next: '/reset-password',
  isPasswordRecovery: true,
  fullUrl: '...'
}
🔐 Password reset flow detected - redirecting to /reset-password
Redirecting to: http://localhost:3000/reset-password
```

**Key lines to look for:**
- ✅ `isPasswordRecovery: true`
- ✅ `🔐 Password reset flow detected`
- ✅ `Redirecting to: http://localhost:3000/reset-password`

### Step 6: Reset Your Password

1. On the `/reset-password` page:
2. Enter new password (min 8 characters)
3. Confirm password
4. Click "Şİfreyİ Sıfırla"
5. ✅ Should see: "Şifreniz başarıyla sıfırlandı."
6. ✅ Should redirect to `/login`
7. Login with new password
8. ✅ Should work!

---

## Debugging: If It Still Goes to /courses

### Check 1: Verify the Console Logs

If you see this in console:
```javascript
isPasswordRecovery: false  // ❌ BAD
```

Then the `type=recovery` parameter is not being detected. Check:
1. Did you restart the dev server?
2. Did you request a NEW password reset (after the code change)?
3. Check the URL in the address bar - does it have `type=recovery`?

### Check 2: Check the URL Parameters

When the callback runs, check the URL in your browser address bar. It should briefly show:
```
http://localhost:3000/api/auth/callback?code=xxxxx&type=recovery&next=/reset-password
```

If `type=recovery` is missing, that's the problem.

### Check 3: Check Supabase Email Template

1. Go to Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Find "Reset Password" template
4. Check the link - it should use: `{{ .ConfirmationURL }}`

This is correct. Supabase will automatically add the token and redirect_to.

### Check 4: Manual Debug Test

Add this temporary code to `/reset-password` page to see what's happening:

```typescript
// Add this to reset-password.tsx after imports
useEffect(() => {
  console.log('🔍 DEBUG: Current URL:', window.location.href);
  console.log('🔍 DEBUG: Session check starting...');
}, []);
```

This will help you see if you're even reaching the reset password page.

---

## Alternative: Force Detection via Session

If the URL parameters still don't work, we can add an alternative detection method using the session type. But try the current fix first!

---

## Common Issues

### Issue 1: Old Reset Link
**Problem:** Using an old password reset link from before the code change  
**Solution:** Request a NEW password reset after restarting the dev server

### Issue 2: Server Not Restarted
**Problem:** Code changes not applied  
**Solution:** Stop (Ctrl+C) and restart (`npm run dev`)

### Issue 3: Browser Cache
**Problem:** Old callback logic cached  
**Solution:** Hard refresh (Ctrl+Shift+R) or clear browser cache

### Issue 4: Middleware Redirect
**Problem:** Middleware redirecting logged-in users  
**Solution:** Check `middleware.ts` - `/reset-password` should be in public paths

Let me check the middleware...

