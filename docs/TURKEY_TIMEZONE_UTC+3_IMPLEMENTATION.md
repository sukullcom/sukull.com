# Turkey Timezone (UTC+3) Implementation

## Overview

The entire streak system has been updated to use **UTC+3 (Turkey Time)** instead of UTC for all date calculations. This ensures the application aligns with Turkish users' local time expectations.

## Key Changes

### 1. Backend Timezone Functions (`actions/daily-streak.ts`)

Updated all utility functions to use UTC+3:

```typescript
/**
 * Utility functions for consistent UTC+3 (Turkey Time) date handling
 * Turkey uses UTC+3 timezone year-round
 */
function getTurkeyNow(): Date {
  const now = new Date();
  // Add 3 hours to convert from UTC to UTC+3 (Turkey Time)
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

function getTurkeyToday(): Date {
  const now = getTurkeyNow();
  // Get today's date in Turkey timezone (UTC+3)
  const turkeyToday = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate()
  ));
  return turkeyToday;
}
```

### 2. Frontend Calendar Component (`components/streak-calendar.tsx`)

Updated to match backend timezone:

```typescript
/**
 * Get current Turkey time (UTC+3)
 */
function getTurkeyNow(): Date {
  const now = new Date();
  // Add 3 hours to convert from UTC to UTC+3 (Turkey Time)
  return new Date(now.getTime() + (3 * 60 * 60 * 1000));
}

function createTurkeyDateString(year: number, month: number, day: number): string {
  const utcDate = new Date(Date.UTC(year, month, day));
  return utcDate.toISOString().split('T')[0];
}
```

### 3. Backward Compatibility

The original function names (`getUTCNow`, `getUTCToday`, etc.) are maintained but now internally use Turkey time:

```typescript
// Keep the old function names for backward compatibility but use Turkey time
function getUTCNow(): Date {
  return getTurkeyNow();
}
```

## Time Conversion Logic

### How UTC+3 is Calculated

1. **Get current UTC time**: `new Date()`
2. **Add 3 hours**: `new Date(now.getTime() + (3 * 60 * 60 * 1000))`
3. **Extract date components**: Using `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`

### Example

```
UTC Time:     2024-01-15 21:30:00
Turkey Time:  2024-01-16 00:30:00 (3 hours ahead)
Date Used:    2024-01-16 (Turkey's "today")
```

## Daily Reset Timing

### Cron Job Schedule

```bash
# Daily at midnight Turkey Time (UTC+3)
# This runs at 21:00 UTC (which is 00:00 Turkey Time)
0 21 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks
```

### Why 21:00 UTC?

- Turkey Time = UTC + 3 hours
- Midnight in Turkey (00:00) = 21:00 UTC the previous day
- This ensures the daily reset happens at exactly midnight for Turkish users

## Impact on Features

### 1. Daily Streak Calculation

- **"Today" starts at**: 00:00 Turkey Time (21:00 UTC previous day)
- **Daily goals reset at**: Midnight Turkey Time
- **Progress tracking**: Based on Turkey Time date boundaries

### 2. Streak Calendar

- **Calendar dates**: Generated using Turkey Time
- **Current day detection**: Uses Turkey Time to determine "today"
- **Future day detection**: Prevents showing streaks for future Turkey Time dates

### 3. Database Storage

- **Dates stored as**: Standard UTC timestamps
- **Calculations done in**: Turkey Time (UTC+3)
- **Consistency**: All date comparisons use the same timezone

## Testing the Implementation

### 1. Verify Current Time

```typescript
// In browser console or API test:
const turkeyTime = new Date(new Date().getTime() + (3 * 60 * 60 * 1000));
console.log('Turkey Time:', turkeyTime);
console.log('UTC Time:', new Date());
```

### 2. Test Daily Reset

Run the manual reset endpoint and check the logs:

```bash
POST /api/test-points
```

Expected logs:
```
📊 Step 1: Updating previous_total_points for all users...
✅ STREAK: Daily goal achieved for 2024-01-16 (UTC+3 Turkey Time)
```

### 3. Verify Calendar

1. Visit profile page
2. Check that current day in calendar matches Turkey date
3. Verify future dates show `istikrarsiz.svg`

## Benefits of This Implementation

### 1. User Experience

- Daily streaks reset at midnight Turkey Time (intuitive for Turkish users)
- Calendar shows correct Turkish dates
- Progress tracking aligns with user expectations

### 2. Technical Consistency

- All components use the same timezone
- No confusion between server and client time
- Database queries are consistent

### 3. Reliability

- Handles timezone conversion consistently
- No dependency on user's browser timezone
- Server-controlled time ensures accuracy

## Troubleshooting

### Issue: Wrong date in calendar

**Solution**: Check that both backend and frontend are using Turkey Time functions

### Issue: Streaks reset at wrong time

**Solution**: Verify cron job runs at 21:00 UTC (00:00 Turkey Time)

### Issue: Database dates don't match

**Solution**: Ensure all date calculations use Turkey Time utilities

## Migration Notes

### Existing Data

- No database migration required
- Existing timestamps remain valid
- New calculations automatically use Turkey Time

### Backward Compatibility

- All existing function names still work
- No breaking changes to API
- Gradual transition to Turkey Time

This implementation ensures that Turkish users experience streak tracking that aligns perfectly with their local time expectations while maintaining technical consistency across the entire application. 