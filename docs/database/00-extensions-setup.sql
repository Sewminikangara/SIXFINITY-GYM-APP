-- SIXFINITY APP - DATABASE EXTENSIONS

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic queries (gym locations)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Database extensions installed successfully!';
    RAISE NOTICE '   - uuid-ossp: For UUID generation';
    RAISE NOTICE '   - postgis: For spatial queries (gym locations)';
END $$;
