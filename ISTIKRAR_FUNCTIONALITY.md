# İstikrar (Streak) Functionality

This document explains the improved streak system that works similar to Duolingo's streak functionality.

## Overview

The istikrar system tracks users' daily learning consistency by monitoring whether they meet their daily point goals. Users earn streak points by achieving their daily targets consecutively.

## How It Works

### Daily Goal System
- Each user has a `dailyTarget` (default: 50 points)
- Users can customize their daily target in their profile settings (25, 50, 75, 100, 150, 200, 250, 300 points)
- Points are earned through:
  - Completing lessons (10 points per challenge)
  - Practice sessions (20 points per challenge)
  - Other learning activities

### Streak Calculation
1. **Daily Tracking**: The system tracks points earned each day vs. daily target
2. **Streak Increment**: When user reaches their daily goal, their streak (`istikrar`) increases by 1
3. **Streak Reset**: If user fails to meet daily goal for a day, their streak resets to 0
4. **Consecutive Days**: Streaks only count consecutive days of meeting goals

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

### updateDailyStreak()
- Called whenever user earns points
- Calculates points earned today vs. daily target
- Updates streak counter if goal is met
- Creates daily streak records

### checkAndResetStreaks()
- Should be called daily (via cron job)
- Resets streaks for users who missed their goal yesterday
- Creates missed day records in the calendar

### getUserDailyStreakForMonth()
- Fetches streak calendar data for a specific month
- Used by the profile calendar component

## Components

### DailyProgress Component
- Shows real-time progress towards daily goal
- Displays current streak count
- Updates every 30 seconds
- Shows percentage progress and remaining points needed

### StreakCalendarAdvanced Component
- Monthly calendar view on profile page
- Shows achieved/missed days with appropriate icons
- Allows navigation between months

## API Endpoints

### /api/cron/reset-streaks
- POST endpoint for daily streak reset
- Requires `CRON_SECRET` authorization
- Should be called daily at midnight

## Installation & Setup

1. **Database Migration**: Ensure latest migration is applied
2. **Cron Job Setup**: Set up daily cron job to call `/api/cron/reset-streaks`
3. **Environment Variables**: Add `CRON_SECRET` for cron job authentication

## Usage Examples

### Setting Up Daily Cron Job
```bash
# Add to your cron jobs (runs daily at midnight)
0 0 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/reset-streaks
```

## Features

### ✅ Implemented
- [x] Daily point tracking and goal comparison
- [x] Automatic streak increment on goal achievement
- [x] Streak reset when goals are missed
- [x] Monthly calendar view with visual indicators
- [x] Real-time daily progress display
- [x] Customizable daily targets
- [x] Database persistence of daily achievements
- [x] Cron job for daily streak resets
- [x] Proper initialization for new and existing users

### 🎯 Like Duolingo
- [x] Visual streak counter in UI
- [x] Daily goal progress bar
- [x] Calendar view with achievement indicators
- [x] Streak reset on missed days
- [x] Consecutive day requirement
- [x] Customizable daily targets

## Usage

1. **Set Daily Target**: Users can customize their daily target in profile settings
2. **Earn Points**: Complete lessons and challenges to earn points
3. **Track Progress**: Watch the daily progress component update in real-time
4. **View Calendar**: Check profile page calendar for achievement history
5. **Maintain Streaks**: Meet daily goals consistently to build streaks

## Troubleshooting

### Streak Not Updating
- Check if `previousTotalPoints` is properly initialized
- Ensure `updateDailyStreak()` is called after point updates
- Verify daily target is set correctly

### Calendar Not Showing Data
- Check if `getUserDailyStreakForMonth()` returns data
- Verify date formatting in calendar component
- Ensure user has streak records in database

### Daily Reset Not Working
- Verify cron job is running daily
- Check `CRON_SECRET` environment variable
- Monitor server logs for reset job execution 