# Streak Functionality Troubleshooting Guide

## Issue: Star Image Not Updating on Current Day

### **Problem Description:**
- Streak count increases correctly when daily goal is achieved
- But the star image in profile calendar doesn't change from gray to gold until the next day
- This makes users think their progress wasn't saved

### **Root Cause:**
1. The streak calendar component was not automatically refreshing its data when users completed challenges and returned to the profile page during the same session.
2. **TIMEZONE ISSUE ALSO FIXED:** `lastStreakCheck` timestamps were showing 3 hours behind due to UTC vs local timezone inconsistencies.

### **✅ Solution Applied:**

#### 1. **Added Auto-Refresh Mechanisms:**
- **Visibility Change Listener:** Calendar refreshes when user switches back to the browser tab
- **Prop Change Listener:** Calendar refreshes when user data updates
- **Manual Refresh Button:** Users can manually refresh with the "↻" button

#### 2. **Enhanced Logging:**
- Added detailed console logs to track when streak records are created/updated
- Logs show exact dates and achievement status with "(UTC)" indicator

#### 3. **Fixed Timezone Handling:**
- **Added UTC utility functions** for consistent date handling
- **Updated all streak functions** to use UTC dates consistently
- **Eliminated 3-hour offset** between `lastStreakCheck` and actual time
- **Improved date boundary calculations** for accurate streak tracking

#### 4. **Fixed Calendar Date Matching:**
- **Fixed timezone mismatch** between calendar component and database dates
- **Calendar now uses UTC dates** to match database storage format
- **Enhanced debug logging** to trace date matching process
- **Resolved `istikrar.svg` not updating** even when database shows `achieved: TRUE`

### **🧪 How to Test the Fix:**

#### **Test Scenario 1: Complete Daily Goal**
1. **Check Current Progress:**
   ```
   Go to Profile → Note current streak number and today's star (should be gray)
   ```

2. **Complete Challenges:**
   ```
   Complete enough lessons to meet daily goal (default: 50 points)
   Each challenge = 10 points, so complete 5+ challenges
   ```

3. **Verify Streak Update:**
   ```
   Check console logs for: "✅ STREAK: Daily goal achieved..."
   Check that streak number increased in top navigation
   ```

4. **Check Calendar Update:**
   ```
   Go to Profile → Today's star should now be GOLD (istikrar.svg)
   If still gray, click the refresh button "↻"
   ```

#### **Test Scenario: Database vs Calendar Mismatch (FIXED)**

**If database shows `achieved: TRUE` but calendar shows gray star:**

1. **Open Profile page**
2. **Open browser console (F12)**
3. **Click calendar refresh button (↻)**
4. **Look for these debug logs:**
   ```javascript
   // ✅ Should see (FIXED):
   "📅 CALENDAR: Date 2025-01-25 found in records with achieved=true"
   
   // ❌ Previous issue (now resolved):
   "📅 CALENDAR: Date 2025-01-25 NOT found in records"
   ```
5. **Result:** Today's star should immediately turn GOLD

#### **Test Scenario 2: Browser Tab Switching**
1. **Complete challenges in one tab**
2. **Switch to different tab/app**
3. **Return to Sukull.com profile page**
4. **Calendar should automatically refresh** (due to visibility change listener)

#### **Test Scenario 3: Manual Refresh**
1. **Go to Profile page**
2. **Click the refresh button "↻" in calendar header**
3. **Calendar should reload with fresh data**

### **🔍 Debug Tools:**

#### **Console Logs to Watch:**
```javascript
// When daily goal is achieved:
"✅ STREAK: Daily goal achieved for user {userId}. Streak: {number} days. Record created for {date}"

// When existing record is updated:
"✅ STREAK: Updated existing record for user {userId}: {number} days. Updated record for {date}"

// When calendar fetches data:
"Failed to fetch daily streak records:" (if there are errors)
```

#### **API Endpoint for Testing:**
```
GET /api/user?action=streak
// Returns: { "streak": number, "userId": "string" }

GET /api/user?action=stats  
// Returns comprehensive user stats including streak
```

#### **Database Check:**
```sql
-- Check if daily streak record exists for today
SELECT * FROM user_daily_streak 
WHERE user_id = 'your-user-id' 
AND date >= '2024-01-XX 00:00:00'  -- Today's date
ORDER BY date DESC;

-- Check user progress
SELECT istikrar, dailyTarget, points, previousTotalPoints 
FROM user_progress 
WHERE userId = 'your-user-id';
```

### **🚀 Expected Behavior After Fix:**

#### **✅ Immediate Star Update:**
- Complete daily goal → Star changes from gray to gold **immediately**
- No need to wait until next day
- No need to refresh browser

#### **✅ Multiple Refresh Triggers:**
- **Tab switching:** Auto-refreshes when you return to the page
- **Manual refresh:** Click "↻" button anytime
- **Data updates:** Auto-refreshes when user data changes

#### **✅ Reliable Data:**
- Calendar always shows current database state
- No stale/cached data issues
- Consistent with streak counter in navigation

### **🐛 If Problems Persist:**

#### **Check These Common Issues:**

1. **Daily Goal Not Met:**
   ```
   - Default daily goal = 50 points
   - Check: Profile → Daily Goal setting
   - Each challenge = 10 points (first time) or 20 points (practice)
   ```

2. **Points Not Counting:**
   ```
   - Only lesson completion gives points
   - Check console for "✅ STREAK:" messages
   - Verify points increased in navigation
   ```

3. **Calendar Still Gray:**
   ```
   - Click manual refresh button "↻"
   - Check browser console for errors
   - Try switching tabs and returning
   ```

4. **Database Issues:**
   ```
   - Check if userDailyStreak record was created
   - Verify user_progress.istikrar increased
   - Check lastStreakCheck timestamp
   ```

### **📞 Support Information:**

If the star image still doesn't update after trying all troubleshooting steps:

1. **Open browser console** (F12)
2. **Complete a challenge** and check for streak logs
3. **Go to profile page** and click refresh button
4. **Screenshot the issue** with console logs visible
5. **Note:** Current streak number vs. calendar display

This will help identify if it's a frontend display issue or backend data issue. 