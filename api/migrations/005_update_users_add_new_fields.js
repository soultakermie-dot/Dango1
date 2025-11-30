exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS city VARCHAR(255),
    ADD COLUMN IF NOT EXISTS experience TEXT,
    ADD COLUMN IF NOT EXISTS education TEXT,
    ADD COLUMN IF NOT EXISTS specialization TEXT,
    ADD COLUMN IF NOT EXISTS price_per_lesson DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS online_offline_format VARCHAR(20) CHECK (online_offline_format IN ('online', 'offline', 'both'));
    
    -- Migrate existing name to first_name if first_name is null
    UPDATE users SET first_name = name WHERE first_name IS NULL;
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS last_name,
    DROP COLUMN IF EXISTS age,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS experience,
    DROP COLUMN IF EXISTS education,
    DROP COLUMN IF EXISTS specialization,
    DROP COLUMN IF EXISTS price_per_lesson,
    DROP COLUMN IF EXISTS online_offline_format;
  `);
};

