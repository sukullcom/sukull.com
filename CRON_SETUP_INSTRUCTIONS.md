# Daily Reset Cron Job Setup Instructions

## ⚠️ CRITICAL: This MUST be set up to prevent previous_total_points from becoming outdated again!

## What This Cron Job Does

Every day at **00:00 Turkey Time (UTC+3)**, which is **21:00 UTC**, the system will:

1. **Update `previous_total_points`** for ALL users to their current `points`
2. **Reset streaks** for users who missed yesterday's daily goal
3. **Set fresh baseline** for the next day's daily goal calculations

## Setup Options

### Option 1: External Cron Service (Recommended)

**Use services like [cron-job.org](https://cron-job.org) or similar:**

```
URL: https://your-domain.com/api/cron/reset-streaks
Method: POST
Headers: Authorization: Bearer YOUR_CRON_SECRET
Schedule: 0 21 * * * (daily at 21:00 UTC = 00:00 Turkey Time)
```

### Option 2: Server Cron Job

**If you have server access, add this to crontab:**

```bash
# Edit crontab
crontab -e

# Add this line (runs at 21:00 UTC = 00:00 Turkey Time)
0 21 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks
```

### Option 3: Vercel Cron Job

**Add to your `vercel.json` file:**

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-streaks",
      "schedule": "0 21 * * *"
    }
  ]
}
```

## Environment Variables

**Make sure you have set:**

```bash
CRON_SECRET=your-secret-key-here
```

## Testing the Setup

**Manual test (as admin):**
```bash
curl -X POST https://your-domain.com/api/test-points
```

**Cron endpoint test:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks
```

## Expected Daily Logs

When working correctly, you should see these logs every day at midnight Turkey Time:

```
🚀 Starting complete daily reset process...
📊 Step 1: Updating previous_total_points for all users...
✅ Updated previous_total_points for 123 users
🎯 Step 2: Checking and resetting streaks...
✅ Step 2 complete: Reset 15 streaks
🎉 Daily reset process completed successfully in 2045ms
```

## Why This Is Critical

**Without this daily reset:**
- ❌ Users get streaks they don't deserve
- ❌ Daily goal calculations become incorrect
- ❌ `istikrar.svg` shows for users who didn't achieve goals
- ❌ Streak system becomes unreliable

**With this daily reset:**
- ✅ Every day starts with correct `previous_total_points` baseline
- ✅ Daily goal calculation: `points - previous_total_points >= daily_target` works correctly
- ✅ Streaks are accurate and meaningful
- ✅ Users see correct achievement status

## Monitoring

**Check these regularly:**
1. **Cron job logs**: Ensure it runs daily at 21:00 UTC
2. **Database**: Verify `previous_total_points` updates daily
3. **User feedback**: Users should see accurate streak status

**Debug endpoint (development only):**
```
GET /api/debug-streak
```

This will show:
- Users with correct vs outdated baselines
- Current Turkey Time
- Sample user analysis

## Troubleshooting

**If streaks become incorrect again:**
1. Check if cron job is running (logs should show daily execution)
2. Verify timezone is correct (should be 21:00 UTC = 00:00 Turkey Time)
3. Run manual reset: `POST /api/test-points`
4. Check debug endpoint to verify fix

**Remember:** This issue will recur if the daily reset stops running!

## Timeline

- **Previous Issue**: `previous_total_points` never updated → incorrect calculations
- **Fixed**: July 27, 2025 - Manual reset corrected all user baselines
- **Prevention**: Daily automated reset at midnight Turkey Time (UTC+3) 