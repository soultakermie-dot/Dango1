exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_request_id INTEGER REFERENCES lesson_requests(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, student_id, lesson_request_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON reviews(student_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS reviews;`);
};

