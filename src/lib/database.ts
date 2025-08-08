import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { DATABASE_SCHEMA, DATABASE_INDEXES, DATABASE_TRIGGERS } from '@/services/core/database/schema'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // 确保数据库目录存在
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // 创建数据库连接
    const dbPath = path.join(dbDir, 'mentor.db')
    db = new Database(dbPath)

    // 启用外键约束
    db.pragma('foreign_keys = ON')
    
    // 初始化数据库表结构
    initializeDatabase(db)
    
    console.log('服务端数据库连接已建立:', dbPath)
  }

  return db
}

function initializeDatabase(database: Database.Database) {
  try {
    // 先执行数据库结构升级
    upgradeDatabase(database)
    
    // 创建表
    const tables = Object.values(DATABASE_SCHEMA)
    for (const tableSQL of tables) {
      database.exec(tableSQL)
    }

    // 创建索引
    for (const indexSQL of DATABASE_INDEXES) {
      database.exec(indexSQL)
    }

    // 创建触发器
    for (const triggerSQL of DATABASE_TRIGGERS) {
      database.exec(triggerSQL)
    }

    console.log('数据库表结构初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

function upgradeDatabase(database: Database.Database) {
  try {
    // 升级ai_config表
    try {
      const aiConfigInfo = database.pragma('table_info(ai_config)')
      const aiConfigColumns = aiConfigInfo.map((col: any) => col.name)
      
      if (aiConfigInfo.length > 0 && !aiConfigColumns.includes('temperature')) {
        console.log('检测到旧版ai_config表，开始升级...')
        database.exec('ALTER TABLE ai_config ADD COLUMN temperature REAL DEFAULT 0.7')
        database.exec('ALTER TABLE ai_config ADD COLUMN max_tokens INTEGER DEFAULT 2000')
        console.log('ai_config表升级完成')
      }
    } catch (error) {
      if (!error.message.includes('no such table')) {
        console.error('升级ai_config表失败:', error)
      }
    }

    // 升级learning_content表
    try {
      const learningContentInfo = database.pragma('table_info(learning_content)')
      const learningContentColumns = learningContentInfo.map((col: any) => col.name)
      
      if (learningContentInfo.length > 0) {
        console.log('检测到learning_content表，检查是否需要升级...')
        
        if (!learningContentColumns.includes('title')) {
          database.exec('ALTER TABLE learning_content ADD COLUMN title TEXT NOT NULL DEFAULT ""')
          console.log('已添加title字段')
        }
        
        if (!learningContentColumns.includes('activity_types')) {
          database.exec('ALTER TABLE learning_content ADD COLUMN activity_types TEXT NOT NULL DEFAULT "reading,listening,speaking"')
          console.log('已添加activity_types字段')
        }
        
        if (!learningContentColumns.includes('is_ai_generated')) {
          database.exec('ALTER TABLE learning_content ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE')
          console.log('已添加is_ai_generated字段')
        }
        
        console.log('learning_content表升级完成')
      }
    } catch (error) {
      if (!error.message.includes('no such table')) {
        console.error('升级learning_content表失败:', error)
      }
    }
  } catch (error) {
    console.error('数据库升级失败:', error)
  }
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}

// 在进程退出时关闭数据库连接
process.on('exit', closeDatabase)
process.on('SIGINT', () => {
  closeDatabase()
  process.exit(0)
})
process.on('SIGTERM', () => {
  closeDatabase()
  process.exit(0)
})