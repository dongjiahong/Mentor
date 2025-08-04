/**
 * 数据库表结构定义
 */

export const DATABASE_SCHEMA = {
  // 用户配置表
  USER_PROFILE: `
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      english_level TEXT NOT NULL CHECK (english_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
      learning_goal TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // AI模型配置表
  AI_CONFIG: `
    CREATE TABLE IF NOT EXISTS ai_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 学习内容表
  LEARNING_CONTENT: `
    CREATE TABLE IF NOT EXISTS learning_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL CHECK (content_type IN ('dialogue', 'article')),
      original_text TEXT NOT NULL,
      translation TEXT NOT NULL,
      difficulty_level TEXT NOT NULL,
      topic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 单词本表
  WORDBOOK: `
    CREATE TABLE IF NOT EXISTS wordbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      definition TEXT NOT NULL,
      pronunciation TEXT,
      add_reason TEXT NOT NULL CHECK (add_reason IN ('translation_lookup', 'pronunciation_error', 'listening_difficulty')),
      proficiency_level INTEGER DEFAULT 0 CHECK (proficiency_level >= 0 AND proficiency_level <= 5),
      review_count INTEGER DEFAULT 0,
      last_review_at DATETIME,
      next_review_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 学习记录表
  LEARNING_RECORDS: `
    CREATE TABLE IF NOT EXISTS learning_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_type TEXT NOT NULL CHECK (activity_type IN ('reading', 'listening', 'speaking', 'translation')),
      content_id INTEGER,
      word TEXT,
      accuracy_score REAL,
      time_spent INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES learning_content(id)
    );
  `,

  // 考试记录表
  EXAM_RECORDS: `
    CREATE TABLE IF NOT EXISTS exam_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_type TEXT NOT NULL CHECK (exam_type IN ('vocabulary', 'pronunciation', 'comprehension')),
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score REAL NOT NULL,
      duration INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
};

// 索引定义
export const DATABASE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_wordbook_word ON wordbook(word);',
  'CREATE INDEX IF NOT EXISTS idx_wordbook_next_review ON wordbook(next_review_at);',
  'CREATE INDEX IF NOT EXISTS idx_learning_records_activity ON learning_records(activity_type);',
  'CREATE INDEX IF NOT EXISTS idx_learning_records_created ON learning_records(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_exam_records_type ON exam_records(exam_type);',
  'CREATE INDEX IF NOT EXISTS idx_learning_content_type ON learning_content(content_type);'
];

// 触发器定义 - 自动更新updated_at字段
export const DATABASE_TRIGGERS = [
  `
    CREATE TRIGGER IF NOT EXISTS update_user_profile_timestamp 
    AFTER UPDATE ON user_profile
    BEGIN
      UPDATE user_profile SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `,
  `
    CREATE TRIGGER IF NOT EXISTS update_ai_config_timestamp 
    AFTER UPDATE ON ai_config
    BEGIN
      UPDATE ai_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `
];