exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, teacher_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_favorites_student_id ON favorites(student_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_teacher_id ON favorites(teacher_id);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS favorites;`);
};

