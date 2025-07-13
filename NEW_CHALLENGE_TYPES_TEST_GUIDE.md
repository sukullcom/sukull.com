# New Challenge Types Test Guide

This guide will help you test the new challenge types that have been implemented in your learning platform.

## 🚀 Quick Start

### 1. Run Database Migration
First, run the migration to add support for new challenge types:

```bash
npm run db:migrate-challenge-types
```

### 2. Create Test Course
Create a comprehensive test course with examples of all new challenge types:

```bash
npm run db:test-challenge-types
```

### 3. Access the Test Course
1. Start your development server: `npm run dev`
2. Navigate to your learning platform
3. Look for "Programming Concepts Test Course" in your courses
4. Start the course to test all new challenge types!

## 🎯 Challenge Types Overview

### **Lesson 1: Drag & Drop Challenge Demo**
**Type: `DRAG_DROP`**

**What it tests:**
- Dragging programming concepts to correct categories
- Matching code syntax to programming languages

**How it works:**
- Items appear at the bottom that you can drag
- Drop zones are shown where items should be placed
- Visual feedback shows correct/incorrect placements
- Challenge completes when all items are correctly placed

**Data Structure:**
```typescript
// Items to drag
dragData: JSON.stringify({ type: "item", itemId: 1 })

// Drop zones
dragData: JSON.stringify({ type: "zone", zoneId: "category", correctItemId: 1 })
```

---

### **Lesson 2: Fill in the Blanks Demo**
**Type: `FILL_BLANK`**

**What it tests:**
- Completing JavaScript code snippets
- Multiple choice fill-in-the-blank questions

**How it works:**
- Blanks are marked with `{1}`, `{2}` etc. in the question
- Users can either type answers directly or select from multiple choice
- Real-time validation as users type
- Challenge completes when all blanks are correctly filled

**Data Structure:**
```typescript
// Question with placeholders
question: "Complete the code: function {1}(name) { {2}.log(name); }"

// Blank options
{ text: "greet", isBlank: true }
{ text: "console", isBlank: true }
```

---

### **Lesson 3: Match Pairs Memory Game**
**Type: `MATCH_PAIRS`**

**What it tests:**
- Matching programming terms with definitions
- Matching data types with example values

**How it works:**
- Cards are face-down initially
- Click cards to flip them over
- Find matching pairs by clicking two related cards
- Beautiful 3D flip animations
- Challenge completes when all pairs are matched

**Data Structure:**
```typescript
// Matching pairs
{ text: "Variable", pairId: 1 }
{ text: "Stores data value", pairId: 1 }
```

---

### **Lesson 4: Sequence Ordering Demo**
**Type: `SEQUENCE`**

**What it tests:**
- Ordering programming workflow steps
- Arranging algorithm steps in correct sequence

**How it works:**
- Items appear in random order
- Drag and drop to reorder (with fallback arrow buttons)
- Visual position indicators (1, 2, 3, 4...)
- Green/red feedback for correct/incorrect positions
- Challenge completes when all items are in correct order

**Data Structure:**
```typescript
// Sequence items
{ text: "Write code", correctOrder: 1 }
{ text: "Test program", correctOrder: 2 }
```

---

### **Lesson 5: Timed Challenge Demo**
**Type: `TIMER_CHALLENGE` and others with `timeLimit`**

**What it tests:**
- Quick math problems (10 seconds)
- Programming concepts (15 seconds)  
- Timed fill-in-the-blank (20 seconds)

**How it works:**
- Countdown timer appears at the top
- Color changes from green → yellow → red as time runs out
- Warning messages appear when time is low
- Challenge auto-fails if time expires
- Can be applied to any challenge type

**Data Structure:**
```typescript
// Timer challenge
{ type: "TIMER_CHALLENGE", timeLimit: 10 }

// Or add timer to any challenge type
{ type: "FILL_BLANK", timeLimit: 20 }
```

---

### **Lesson 6: Classic Challenges (SELECT/ASSIST)**
**For comparison with original challenge types**

- **SELECT**: Multiple choice with grid layout
- **ASSIST**: Question bubble with single answer options

## 🎨 Visual Features

### **Drag & Drop**
- ✨ Smooth drag animations
- 🎯 Drop zone highlighting
- ✅ Visual success/error feedback
- 📱 Touch device support

### **Match Pairs**
- 🃏 3D card flip animations
- 🎨 Gradient card backs with "?" symbol
- 📊 Progress indicator
- 🔄 Smooth card shuffling

### **Sequence**
- 📋 Numbered position indicators
- ↕️ Fallback arrow buttons for mobile
- 🎯 Drag handle indicators
- ✅ Real-time position validation

### **Timer**
- ⏱️ Visual countdown with progress bar
- 🚨 Color-coded warnings (green → yellow → red)
- ⚠️ Alert messages for urgency
- 🔔 Pulse animations for final seconds

### **Fill Blank**
- ✏️ Inline text inputs
- 📝 Multiple choice mode support
- ✅ Real-time validation
- 🎨 Visual feedback for correct/incorrect

## 🔧 Technical Implementation

### **Database Schema Changes**
```sql
-- New challenge types
ALTER TYPE "type" ADD VALUE 'DRAG_DROP';
ALTER TYPE "type" ADD VALUE 'FILL_BLANK';
ALTER TYPE "type" ADD VALUE 'MATCH_PAIRS';
ALTER TYPE "type" ADD VALUE 'SEQUENCE';
ALTER TYPE "type" ADD VALUE 'TIMER_CHALLENGE';

-- New fields
ALTER TABLE "challenges" ADD COLUMN "time_limit" integer;
ALTER TABLE "challenges" ADD COLUMN "metadata" text;
ALTER TABLE "challenge_options" ADD COLUMN "correct_order" integer;
ALTER TABLE "challenge_options" ADD COLUMN "pair_id" integer;
ALTER TABLE "challenge_options" ADD COLUMN "is_blank" boolean DEFAULT false;
ALTER TABLE "challenge_options" ADD COLUMN "drag_data" text;
```

### **Component Architecture**
```
Challenge Component (Router)
├── DragDropChallenge
├── FillBlankChallenge  
├── MatchPairsChallenge
├── SequenceChallenge
├── TimerChallenge (Wrapper)
├── Card (Original SELECT/ASSIST)
```

### **Dependencies Added**
- `@hello-pangea/dnd` - Drag and drop functionality
- Custom CSS - 3D animations and visual effects

## 🧪 Testing Checklist

### **Drag & Drop**
- [ ] Items can be dragged from source area
- [ ] Drop zones highlight when dragging over them
- [ ] Items snap into correct zones
- [ ] Incorrect placements show visual feedback
- [ ] Challenge completes when all items placed correctly
- [ ] Works on both desktop and mobile

### **Fill Blank**
- [ ] Text inputs appear where `{1}`, `{2}` placeholders are
- [ ] Typing validation works in real-time
- [ ] Multiple choice mode displays correctly
- [ ] Case-insensitive matching works
- [ ] Challenge completes when all blanks filled correctly

### **Match Pairs**
- [ ] Cards start face-down
- [ ] Clicking flips cards with animation
- [ ] Two flipped cards check for match
- [ ] Matched pairs stay face-up
- [ ] Non-matching pairs flip back after delay
- [ ] Progress indicator updates correctly
- [ ] Challenge completes when all pairs matched

### **Sequence**
- [ ] Items start in random order
- [ ] Drag and drop reordering works
- [ ] Arrow button fallbacks work on mobile
- [ ] Position numbers update correctly
- [ ] Visual feedback for correct/incorrect positions
- [ ] Challenge completes when sequence is correct

### **Timer Challenges**
- [ ] Countdown timer displays and updates
- [ ] Progress bar decreases over time
- [ ] Colors change appropriately (green→yellow→red)
- [ ] Warning messages appear at right times
- [ ] Timer stops when challenge completed
- [ ] Challenge fails automatically when time expires
- [ ] Works wrapped around other challenge types

### **General Integration**
- [ ] All challenge types work with existing Check/Retry/Next flow
- [ ] Hearts system integration works correctly
- [ ] Points are awarded appropriately
- [ ] Progress tracking works
- [ ] Audio feedback plays correctly
- [ ] Responsive design works on all screen sizes

## 🎯 Expected Behaviors

### **Success Flow**
1. User completes challenge correctly
2. Visual feedback shows success (green colors)
3. Correct audio plays
4. Points are awarded
5. "Next" button appears
6. Progress bar advances

### **Error Flow**
1. User makes incorrect choice/runs out of time
2. Visual feedback shows error (red colors)
3. Incorrect audio plays
4. Heart is lost (if applicable)
5. "Retry" button appears
6. User can try again

### **Timer Expiration**
1. Timer reaches zero
2. Challenge automatically marked as incorrect
3. Same as error flow above

## 🐛 Troubleshooting

### **Common Issues**

**Migration Fails:**
- Ensure DATABASE_URL is set in environment
- Check database connection
- Run migration script manually

**Drag & Drop Not Working:**
- Check if `@hello-pangea/dnd` is installed
- Verify drag data is properly formatted JSON
- Check console for errors

**Timer Not Appearing:**
- Verify `timeLimit` is set in challenge data
- Check if TimerChallenge wrapper is applied
- Ensure timer logic is not disabled

**Cards Not Flipping:**
- Check CSS classes are loaded
- Verify 3D animation styles in globals.css
- Test in different browsers

**Challenges Not Completing:**
- Check if correct answer option exists with `correct: true`
- Verify logic for each challenge type completion
- Check console for JavaScript errors

## 📈 Performance Notes

- Challenge components are optimized for minimal re-renders
- Drag operations use efficient state management
- Timer uses single interval, cleaned up properly
- 3D animations use CSS transforms (GPU accelerated)
- Large courses load progressively

## 🔄 Backward Compatibility

All existing functionality remains unchanged:
- ✅ Original SELECT and ASSIST challenges work exactly as before
- ✅ Existing course scripts continue to work
- ✅ All lesson flow, progression, and UI remains the same
- ✅ Database structure is additive only (no breaking changes)

The new challenge types are completely optional and can be used alongside existing challenges in any combination. 