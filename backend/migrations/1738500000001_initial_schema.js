exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('users', 'email');

  pgm.createTable('courses', {
    id: 'id',
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('courses', 'user_id');

  pgm.createTable('sessions', {
    id: 'id',
    course_id: { type: 'integer', notNull: true, references: 'courses(id)', onDelete: 'CASCADE' },
    title: { type: 'varchar(255)', notNull: true },
    session_date: { type: 'date' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('sessions', 'course_id');

  pgm.createTable('uploads', {
    id: 'id',
    session_id: { type: 'integer', notNull: true, references: 'sessions(id)', onDelete: 'CASCADE' },
    file_path: { type: 'varchar(512)', notNull: true },
    original_filename: { type: 'varchar(255)', notNull: true },
    file_type: { type: 'varchar(64)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('uploads', 'session_id');

  pgm.createTable('notes', {
    id: 'id',
    session_id: { type: 'integer', notNull: true, references: 'sessions(id)', onDelete: 'CASCADE' },
    content: { type: 'text' },
    table_data: { type: 'jsonb' },
    highlights: { type: 'jsonb' },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('notes', 'session_id');
};

exports.down = (pgm) => {
  pgm.dropTable('notes');
  pgm.dropTable('uploads');
  pgm.dropTable('sessions');
  pgm.dropTable('courses');
  pgm.dropTable('users');
};
