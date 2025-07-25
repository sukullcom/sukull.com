# Calendar Image Debug Guide

## 🐛 **Issue Fixed**

**Problem:** Database shows `achieved: TRUE` but profile calendar still displays `istikrarsiz.svg` (gray star) instead of `istikrar.svg` (gold star).

**Root Cause:** Timezone mismatch between calendar date creation (local) and database storage (UTC).

## ✅ **Solution Applied**

### **1. UTC Date Consistency:**
```javascript
// OLD (Problematic):
const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
const dateStr = dateObj.toISOString().split("T")[0]; // Local timezone → UTC conversion

// NEW (Fixed):  
function createUTCDateString(year: number, month: number, day: number): string {
  const utcDate = new Date(Date.UTC(year, month, day));
  return utcDate.toISOString().split('T')[0]; // Pure UTC → UTC
}
```

### **2. Enhanced Debug Logging:**
```javascript
console.log("📅 CALENDAR: Fetching streak records for", format(date, "MMMM yyyy"));
console.log("📅 CALENDAR: Received", recs.length, "records:", recs);
console.log(`📅 CALENDAR: Date ${cell.date} found in records with achieved=${achieved}`);
```

## 🧪 **Testing the Fix**

### **Step 1: Verify Database State**
```sql
-- Check user progress
SELECT userId, daily_target, previous_total_points, points, istikrar, last_streak_check
FROM user_progress 
WHERE userId = 'your-user-id';

-- Check daily streak record
SELECT userId, date, achieved, created_at
FROM user_daily_streak 
WHERE userId = 'your-user-id' 
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### **Step 2: Check Calendar Console Logs**
1. **Open Profile page**
2. **Open browser console (F12)**
3. **Look for these logs:**

```javascript
// ✅ Good - Data fetched successfully
"📅 CALENDAR: Fetching streak records for January 2025"
"📅 CALENDAR: Received 3 records: [{date: '2025-01-25', achieved: true}, ...]"

// ✅ Good - Date found and matched
"📅 CALENDAR: Date 2025-01-25 found in records with achieved=true"

// ❌ Bad - Date not found (indicates mismatch)
"📅 CALENDAR: Date 2025-01-25 NOT found in records"
```

### **Step 3: Manual Refresh Test**
1. **Click the ↻ refresh button** in calendar header
2. **Watch console logs** for fresh data fetch
3. **Verify image changes** immediately

### **Step 4: Verify Date Format Consistency**

**Console Test:**
```javascript
// Run in browser console to check date formats:
const now = new Date();

// How calendar NOW creates dates (UTC):
const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
console.log("Calendar date:", utcDate.toISOString().split('T')[0]);

// How database stores dates (should match):
console.log("Database should have:", utcDate.toISOString().split('T')[0]);
```

## 🎯 **Expected Results After Fix**

### **Scenario: Goal Already Achieved**

**Database State:**
```
daily_target: 50
previous_total_points: 90  
points: 150
istikrar: 1
user_daily_streak.achieved: TRUE
```

**Expected Calendar Behavior:**
- **Image:** `istikrar.svg` (gold star) ✅
- **Console:** `"Date 2025-01-25 found in records with achieved=true"` ✅

### **Before Fix (Broken):**
```
Calendar date: "2025-01-24" (local timezone issue)
Database date: "2025-01-25" (UTC)
Match: false → Shows gray star ❌
```

### **After Fix (Working):**
```
Calendar date: "2025-01-25" (UTC consistent)  
Database date: "2025-01-25" (UTC)
Match: true → Shows gold star ✅
```

## 🔍 **Debugging Checklist**

### **If image still doesn't change:**

1. **Check Console Logs:**
   ```javascript
   // Should see:
   "📅 CALENDAR: Date YYYY-MM-DD found in records with achieved=true"
   
   // If you see:
   "📅 CALENDAR: Date YYYY-MM-DD NOT found in records"
   // → Date format mismatch still exists
   ```

2. **Verify Database Records:**
   ```sql
   -- Check if today's record exists
   SELECT date, achieved 
   FROM user_daily_streak 
   WHERE userId = 'your-user-id' 
     AND date = CURRENT_DATE;
   ```

3. **Manual Refresh:**
   - Click ↻ button in calendar header
   - Should trigger immediate refresh

4. **Cross-Reference Daily Progress:**
   - Check if Daily Progress component shows gold star
   - Both should be consistent

## 🚀 **Immediate Verification Steps**

### **For Your Current Issue:**

1. **Open Profile page**
2. **Open browser console (F12)**  
3. **Click calendar refresh button (↻)**
4. **Look for:** `"Date 2025-01-25 found in records with achieved=true"`
5. **Today's cell should immediately show gold star**

### **Expected Console Output:**
```javascript
📅 CALENDAR: Manual refresh triggered
📅 CALENDAR: Fetching streak records for January 2025
📅 CALENDAR: Received 1 records: [{id: 123, date: "2025-01-25", achieved: true}]
📅 CALENDAR: Formatted records: [{id: 123, date: "2025-01-25", achieved: true}]
📅 CALENDAR: Date 2025-01-25 found in records with achieved=true
```

## 📊 **Performance Notes**

- **Faster refresh:** Enhanced auto-refresh triggers
- **Immediate feedback:** Manual refresh with loading indicator  
- **Debug visibility:** Comprehensive console logging
- **UTC consistency:** Eliminates timezone-related bugs

The timezone fix ensures the calendar component correctly matches database dates, resolving the `istikrarsiz.svg` → `istikrar.svg` update issue! 