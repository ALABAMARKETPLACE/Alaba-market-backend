-- Add new columns to users table
-- Run this migration to add registration fields

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "countrycode" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "licenseNumber" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "vehicleNumber" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "companyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "companyDescription" TEXT,
ADD COLUMN IF NOT EXISTS "registrationNumber" VARCHAR(100);

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('countrycode', 'licenseNumber', 'vehicleNumber', 'companyName', 'companyDescription', 'registrationNumber')
ORDER BY column_name;
