exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_request_id INTEGER REFERENCES lesson_requests(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_unique_request ON chats(student_id, teacher_id, lesson_request_id) WHERE lesson_request_id IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_chats_student_id ON chats(student_id);
    CREATE INDEX IF NOT EXISTS idx_chats_teacher_id ON chats(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_chats_lesson_request_id ON chats(lesson_request_id);
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP TABLE IF EXISTS chats;`);
};

