# Previous Total Points Fix Documentation

## Problem Description

The `previous_total_points` field in the `user_progress` table was not being updated correctly, causing incorrect daily goal calculations. This resulted in users appearing to achieve their daily goals when they actually hadn't.

### Issue Details

1. **Root Cause**: `previous_total_points` was only updated when a user first earned points on a new day, rather than being updated at the end of each day for all users.

2. **Impact**: The daily goal calculation `points - previous_total_points >= daily_target` was incorrect because `previous_total_points` contained outdated values.

3. **Symptom**: Users would see `istikrar.svg` (achieved) instead of `istikrarsiz.svg` (not achieved) on their streak calendar even when they hadn't met their daily goal.

## Solution

### 1. New Function: `updatePreviousTotalPointsForAllUsers()`

This function updates `previous_total_points` to the current `points` value for ALL users. This should be called at the end of each day to set the baseline for the next day's calculations.

```typescript
// Sets previous_total_points = current points for all users
// This creates the correct baseline for tomorrow's daily goal calculation
await updatePreviousTotalPointsForAllUsers();
```

### 2. Enhanced Daily Reset Process: `performDailyReset()`

This function combines the previous points update with streak checking:

1. **Step 1**: Update `previous_total_points` for all users (sets tomorrow's baseline)
2. **Step 2**: Check and reset streaks for users who missed yesterday's goal

### 3. Fixed `updateDailyStreak()` Logic

Removed the problematic logic that incorrectly updated `previous_total_points` when detecting a new day. Now it simply uses the existing `previous_total_points` value that's maintained by the daily cron job.

### 4. Updated Cron Job

The `/api/cron/reset-streaks` endpoint now calls `performDailyReset()` instead of just `checkAndResetStreaks()`.

## Testing the Fix

### 1. Manual Reset (Admin Only)

To immediately fix existing data, admin users can trigger a manual reset:

```bash
# POST request to trigger immediate reset
curl -X POST https://your-domain.com/api/test-points
```

This will:
- Update `previous_total_points` for all users to their current points
- Fix any incorrect streak calculations
- Provide a summary of changes made

### 2. Verify the Fix

After running the reset, check:

1. **Database**: `previous_total_points` should equal current `points` for all users
2. **Profile Page**: Streak calendar should show correct achievement status
3. **Daily Progress**: Should calculate correctly based on points earned since midnight

### 3. Cron Job Setup

Ensure the daily cron job is properly configured:

```bash
# Daily at midnight Turkey Time (UTC+3)
# This runs at 21:00 UTC (which is 00:00 Turkey Time)
0 21 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks
```

## Expected Behavior After Fix

1. **At Midnight (Turkey Time UTC+3)**: All users' `previous_total_points` gets updated to their current `points`
2. **During the Day**: Daily goal calculation uses the correct baseline
3. **Real-time Updates**: Streak calendar and progress indicators show accurate status
4. **Consistency**: All timezone calculations are in UTC+3 (Turkey Time) for reliability

## Database Schema Impact

No schema changes required. The fix only affects how the existing `previous_total_points` field is updated and used.

## Monitoring

The enhanced logging will show:
- How many users were updated each day
- How many streaks were reset
- Detailed timing information
- Any errors that occur during the process

## Files Changed

- `actions/daily-streak.ts`: Added new functions and fixed logic
- `app/api/cron/reset-streaks/route.ts`: Updated to use new daily reset process
- `app/api/test-points/route.ts`: New endpoint for manual testing 