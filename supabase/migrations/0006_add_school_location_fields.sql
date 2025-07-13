-- Add new columns to schools table
ALTER TABLE schools 
ADD COLUMN city TEXT,
ADD COLUMN district TEXT,
ADD COLUMN category TEXT,
ADD COLUMN kind TEXT;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district);
CREATE INDEX IF NOT EXISTS idx_schools_category ON schools(category);
CREATE INDEX IF NOT EXISTS idx_schools_kind ON schools(kind);
CREATE INDEX IF NOT EXISTS idx_schools_location_search ON schools(city, district);
CREATE INDEX IF NOT EXISTS idx_schools_name_search ON schools USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_schools_name_ilike ON schools (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_schools_total_points ON schools(total_points DESC);

-- After adding columns, we need to populate them with the import script
-- For now, set NOT NULL constraints after import 