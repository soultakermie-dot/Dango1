exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS teacher_availability (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, date, start_time)
    );
    
    CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_availability_date ON teacher_availability(date);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS teacher_availability;`);
};

