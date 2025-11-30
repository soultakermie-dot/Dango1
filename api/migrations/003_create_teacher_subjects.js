exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, subject_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS teacher_subjects;`);
};

