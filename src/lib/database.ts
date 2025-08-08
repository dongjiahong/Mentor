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