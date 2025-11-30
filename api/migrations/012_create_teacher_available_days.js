exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS teacher_available_days (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, day_of_week)
    );
    
    CREATE INDEX IF NOT EXISTS idx_teacher_available_days_teacher_id ON teacher_available_days(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_available_days_day_of_week ON teacher_available_days(day_of_week);
    
    COMMENT ON TABLE teacher_available_days IS 'Weekly recurring availability for teachers. day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS teacher_available_days;`);
};

