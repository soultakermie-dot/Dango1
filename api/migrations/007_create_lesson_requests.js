exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS lesson_requests (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
      requested_date DATE,
      requested_time TIME,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_lesson_requests_student_id ON lesson_requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_requests_teacher_id ON lesson_requests(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_requests_status ON lesson_requests(status);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS lesson_requests;`);
};

