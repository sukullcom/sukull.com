# School System Setup and Usage

## Overview
The school system now supports 45,000+ schools from Turkey with advanced search and leaderboard features.

## Database Schema Updates

### New School Fields
- `city`: School's city (e.g., "ANKARA", "İSTANBUL")
- `district`: School's district (e.g., "ÇANKAYA", "KADIKOY")
- `category`: Human readable category ("Primary School", "Secondary School", "High School", "University")
- `kind`: School specialization (e.g., "Anadolu Lisesi", "İmam Hatip Ortaokulu", can be null)

### School Type Mapping
```
"Primary School" → "elementary_school"
"Secondary School" → "secondary_school"
"High School" → "high_school"
"University" → "university"
```

## Setup Instructions

### 1. Run Database Migration
```bash
npm run db:migrate
```

### 2. Import School Data
```bash
npm run schools:import
```

This will:
- Read from `data/schools_parsed.csv`
- Fix Turkish character encoding issues
- Process schools in batches of 500
- Add proper search indexes
- Set NOT NULL constraints after successful import

## API Endpoints

### Hierarchical School Selection (Recommended)

#### 1. Get Cities: `/api/schools/filtered?step=cities`
Returns all available cities with school counts.

#### 2. Get Districts: `/api/schools/filtered?step=districts&city=ANKARA`
Returns districts for selected city with school counts.

#### 3. Get Categories: `/api/schools/filtered?step=categories&city=ANKARA&district=ÇANKAYA`
Returns school categories for selected city/district with counts.

#### 4. Get Schools: `/api/schools/filtered?step=schools&city=ANKARA&district=ÇANKAYA&category=High School&q=Fen`
Returns max 10 schools matching the filters. The `q` parameter is optional for name search.

### Alternative Individual Endpoints

#### Cities: `/api/schools/cities`
Get all cities with school counts.

#### Districts: `/api/schools/districts?city=ANKARA`
Get districts for a specific city.

#### Categories: `/api/schools/categories?city=ANKARA&district=ÇANKAYA`
Get categories for city/district combination.

### Legacy Search: `/api/schools/search`
**GET Parameters (All Required):**
- `city`: City name (required)
- `district`: District name (required)  
- `category`: School category (required)
- `q`: Search query (optional, minimum 1 character)

**Example:**
```
/api/schools/search?city=ANKARA&district=ÇANKAYA&category=High School&q=Fen
```
Returns maximum 10 schools.

### School Leaderboard: `/api/schools/leaderboard`
**GET Parameters:**
- `type`: School type filter
- `city`: City filter
- `limit`: Maximum results (default: 10)

**POST**: Get all categories at once
```json
{
  "city": "ANKARA", // optional
  "limit": 10
}
```

**Response:**
```json
{
  "leaderboards": {
    "university": [...],
    "high_school": [...],
    "secondary_school": [...],
    "elementary_school": [...]
  }
}
```

## Frontend Integration

### Updated Types
The `School` interface now includes:
```typescript
interface School {
  id: number;
  name: string;
  city: string;
  district: string;
  category: string;
  kind: string | null;
  type: string;
  totalPoints: number;
}
```

### Hierarchical School Selection Implementation

#### Step 1: City Selection
```javascript
// Get all cities
const citiesResponse = await fetch('/api/schools/filtered?step=cities');
const { cities } = await citiesResponse.json();
// Display: "ANKARA (1,234 schools)", "İSTANBUL (2,567 schools)"
```

#### Step 2: District Selection
```javascript
// After user selects city
const districtsResponse = await fetch(`/api/schools/filtered?step=districts&city=${selectedCity}`);
const { districts } = await districtsResponse.json();
// Display: "ÇANKAYA (345 schools)", "KEÇIÖREN (234 schools)"
```

#### Step 3: Category Selection
```javascript
// After user selects district
const categoriesResponse = await fetch(`/api/schools/filtered?step=categories&city=${selectedCity}&district=${selectedDistrict}`);
const { categories } = await categoriesResponse.json();
// Display: "High School (12 schools)", "Secondary School (8 schools)"
```

#### Step 4: School Selection (with optional search)
```javascript
// After user selects category, optionally with search
const searchQuery = userInput; // Optional
const schoolsResponse = await fetch(`/api/schools/filtered?step=schools&city=${selectedCity}&district=${selectedDistrict}&category=${selectedCategory}&q=${searchQuery}`);
const { schools } = await schoolsResponse.json();
// Display: Maximum 10 schools, "did you mean" style
```

### Implementation Tips
- No debouncing needed (max 10 results)
- Show counts for each option to guide users
- Allow search in final step for precision
- Cache city/district data client-side

### Leaderboard Features
- **Öğrenci Sıralamanız**: Individual student ranking
- **Okulunuzun Sıralaması**: School's rank among all schools of same type
- **Okul İçindeki Sıralamanız**: Student's rank within their school
- **Top 10 by Category**: Separate leaderboards for each school type

## Performance Considerations

### Database Indexes
The following indexes are automatically created:
- `idx_schools_city`
- `idx_schools_district`
- `idx_schools_category`
- `idx_schools_kind`
- `idx_schools_location_search`
- `idx_schools_name_search` (full-text)
- `idx_schools_name_ilike` (pattern matching)
- `idx_schools_total_points` (leaderboard sorting)

### Optimization Tips
1. Always use pagination/limits
2. Implement client-side caching for popular searches
3. Use debounced search to reduce API calls
4. Consider regional pre-filtering for better UX

## Turkish Character Handling
The import script automatically fixes common encoding issues:
- `Ä°` → `İ`
- `Ã¶` → `ö`
- `Ã¼` → `ü`
- `Ã§` → `ç`
- `Ä±` → `ı`
- `ÅŸ` → `ş`
- And many more...

## Data Statistics
- **Total Schools**: ~45,000
- **Cities**: All major Turkish cities
- **Types**: Primary, Secondary, High School, University
- **Storage**: ~10-15MB additional database space
- **Performance**: Search queries under 50ms with proper indexing 