# İstikrar (Streak) Functionality - DUOLINGO STYLE

This document explains the improved streak system that works **exactly like Duolingo's** streak functionality.

## Overview

The istikrar system tracks users' daily learning consistency by monitoring whether they meet their daily point goals. Users earn streak points by achieving their daily targets consecutively. **If they miss even one day, their streak resets to zero.**

## How It Works (Like Duolingo)

### Daily Goal System
- Each user has a `dailyTarget` (default: 50 points)
- Users can customize their daily target in their profile settings (25, 50, 75, 100, 150, 200, 250, 300 points)
- Points are earned through:
  - Completing lessons (10 points per challenge)
  - Practice sessions (20 points per challenge)
  - Other learning activities

### Streak Calculation (Duolingo Logic)
1. **Daily Tracking**: The system tracks points earned each day (00:00 - 23:59) vs. daily target
2. **Streak Increment**: When user reaches their daily goal, their streak (`istikrar`) increases by 1
3. **Streak Reset**: If user fails to meet daily goal for **ANY** day, their streak resets to **0**
4. **Consecutive Days**: Streaks only count consecutive days of meeting goals
5. **Automatic Detection**: System automatically detects missed days when user returns
6. **Immediate Reset**: Streak resets as soon as user interacts with app after missing a day

### New Enhanced Features

#### ✅ Proactive Streak Checking
- **`checkStreakContinuity()`**: Automatically called when users interact with the app
- Detects missed days between last activity and today
- Creates records for all missed days
- Immediately resets streak to 0 if any day was missed

#### ✅ Day Boundary Detection (00:00 - 23:59)
- Proper daily boundary calculation using `setHours(0, 0, 0, 0)`
- Points earned from midnight to midnight count toward daily goal
- Baseline points reset at start of each new day

#### ✅ Multiple Missed Days Handling
- Detects if user was inactive for multiple days
- Creates missed day records for all days between last activity and today
- Properly resets streak regardless of how many days were missed

#### ✅ Real-time Streak Validation
- Called in protected layout - checks streak every time user accesses app
- Called when earning points - ensures streak is up-to-date
- Called when viewing profile - shows accurate streak information

### Visual Indicators
- **istikrar.svg**: Shows for days when the daily goal was achieved (gold star)
- **istikrarsiz.svg**: Shows for days when the daily goal was not met (gray star)

## Database Schema

### user_progress table
```sql
istikrar INTEGER DEFAULT 0,                    -- Current streak count
dailyTarget INTEGER DEFAULT 50,              -- User's daily point goal
lastStreakCheck TIMESTAMP,                   -- Last time streak was checked
previousTotalPoints INTEGER DEFAULT 0,       -- Points at last check (for daily calculation)
```

### user_daily_streak table
```sql
id SERIAL PRIMARY KEY,
user_id TEXT NOT NULL,                       -- User ID
date TIMESTAMP NOT NULL,                     -- Date (midnight)
achieved BOOLEAN DEFAULT FALSE               -- Whether daily goal was met
```

## Key Functions

### checkStreakContinuity() **[NEW]**
- **Purpose**: Main function that ensures streaks are properly maintained
- **When called**: Every time user interacts with the app
- **What it does**:
  - Calculates days between last check and today
  - If multiple days missed → Reset streak to 0
  - If yesterday not achieved → Reset streak to 0
  - Creates missed day records for calendar
  - Updates baseline points for new day

### updateDailyStreak() **[ENHANCED]**
- **Purpose**: Called when user earns points to check daily goal achievement
- **What it does**:
  - First calls `checkStreakContinuity()` to ensure streak is valid
  - Calculates points earned today vs. daily target
  - Updates streak counter if goal is met for first time today
  - Creates/updates daily achievement records

### checkAndResetStreaks() **[CRON JOB]**
- **Purpose**: Backup daily reset for users who don't use the app
- **When called**: Daily via cron job at midnight
- **What it does**:
  - Finds users with active streaks
  - Checks if they achieved yesterday's goal
  - Resets streaks for users who missed their goal

## Components

### DailyProgress Component
- Shows real-time progress towards daily goal
- Displays current streak count
- Updates based on points earned today
- Shows percentage progress and remaining points needed

### StreakCalendarAdvanced Component
- Monthly calendar view on profile page
- Shows achieved/missed days with appropriate icons
- Allows navigation between months
- Displays accurate historical data

## API Endpoints

### /api/cron/reset-streaks
- **POST**: Triggers daily streak reset (requires `CRON_SECRET`)
- **GET**: Health check endpoint
- Should be called daily at midnight for inactive users

## Installation & Setup

### 1. Environment Variables
```bash
CRON_SECRET=your-secret-key-here
```

### 2. Daily Cron Job Setup
```bash
# Option 1: Server cron job (runs daily at midnight)
0 0 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks

# Option 2: Vercel Cron Job (add to vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/reset-streaks",
      "schedule": "0 0 * * *"
    }
  ]
}

# Option 3: External service (recommended)
# Use services like cron-job.org or similar
```

### 3. Test the System
```bash
# Test cron endpoint
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks

# Check health
curl https://your-domain.com/api/cron/reset-streaks
```

## Features

### ✅ Duolingo-Style Features Implemented
- [x] **Automatic streak reset when missing any day**
- [x] **Daily boundary detection (00:00 - 23:59)**
- [x] **Proactive checking when user returns to app**
- [x] **Multiple missed days detection**
- [x] **Visual streak counter in UI**
- [x] **Daily goal progress bar**
- [x] **Calendar view with achievement indicators**
- [x] **Consecutive day requirement**
- [x] **Customizable daily targets**
- [x] **Real-time daily progress display**
- [x] **Database persistence of daily achievements**
- [x] **Backup cron job for daily resets**
- [x] **Proper initialization for new and existing users**

### 🎯 Exactly Like Duolingo
- [x] Streak resets to 0 if you miss one day
- [x] Daily goals from midnight to midnight
- [x] Immediate detection when you return after missing days
- [x] Visual calendar showing achieved vs missed days
- [x] Real-time progress tracking
- [x] Customizable daily targets

## Usage Examples

### Scenario 1: User Misses One Day
```
Day 1: User earns 60/50 points ✅ Streak: 1
Day 2: User earns 0/50 points ❌ 
Day 3: User returns, streak automatically reset to 0
Day 3: User earns 70/50 points ✅ Streak: 1 (starts over)
```

### Scenario 2: User Misses Multiple Days
```
Day 1: User earns 80/50 points ✅ Streak: 5
Day 2: User doesn't use app ❌
Day 3: User doesn't use app ❌
Day 4: User doesn't use app ❌
Day 5: User returns, streak automatically reset to 0
Day 5: User earns 60/50 points ✅ Streak: 1 (starts over)
```

### Scenario 3: Perfect Streak
```
Day 1: User earns 55/50 points ✅ Streak: 1
Day 2: User earns 75/50 points ✅ Streak: 2
Day 3: User earns 120/50 points ✅ Streak: 3
...continues as long as daily goal is met...
```

## Troubleshooting

### Streak Not Resetting When Expected
- **Check**: Is `checkStreakContinuity()` being called?
- **Solution**: Ensure it's called in protected layout and point-earning functions
- **Verify**: Check `lastStreakCheck` timestamp in database

### Daily Progress Not Accurate
- **Check**: Is `previousTotalPoints` being reset daily?
- **Solution**: Baseline should reset at start of each day (00:00)
- **Verify**: Points earned today = current points - baseline points

### Cron Job Not Working
- **Check**: Is `CRON_SECRET` environment variable set?
- **Test**: Call the endpoint manually with curl
- **Monitor**: Check server logs for cron execution
- **Alternative**: Use external cron services

### Calendar Not Showing Missed Days
- **Check**: Are missed day records being created?
- **Solution**: `checkStreakContinuity()` should create records for all missed days
- **Verify**: Query `user_daily_streak` table for missing dates

## Security Notes

- Cron endpoint requires Bearer token authentication
- All database operations are server-side only
- User authentication required for all streak operations
- Proper error handling prevents data corruption

This system now works **exactly like Duolingo's** - miss one day, lose your streak! 🔥 