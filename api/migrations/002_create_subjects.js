exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT INTO subjects (name) VALUES 
      ('Math'),
      ('History'),
      ('English'),
      ('Biology')
    ON CONFLICT (name) DO NOTHING;
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS subjects;`);
};

