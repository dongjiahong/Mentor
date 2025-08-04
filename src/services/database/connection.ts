import initSqlJs, { Database } from 'sql.js';
import { DatabaseError, DatabaseErrorType } from '@/types';
import { DATABASE_SCHEMA, DATABASE_INDEXES, DATABASE_TRIGGERS } from './schema';

/**
 * 数据库连接管理器
 * 负责SQLite数据库的初始化、连接管理和基础操作
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取数据库连接实例（单例模式）
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      // 初始化sql.js
      const SQL = await initSqlJs({
        // 从CDN加载wasm文件
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // 尝试从localStorage加载现有数据库
      const savedDb = localStorage.getItem('english_learning_db');
      
      if (savedDb) {
        // 从base64字符串恢复数据库
        const dbData = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
        this.db = new SQL.Database(dbData);
      } else {
        // 创建新数据库
        this.db = new SQL.Database();
      }

      // 创建表结构
      await this.createTables();
      
      // 创建索引
      await this.createIndexes();
      
      // 创建触发器
      await this.createTriggers();

      this.isInitialized = true;
      
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw new DatabaseError({
        type: DatabaseErrorType.INITIALIZATION_FAILED,
        message: '数据库初始化失败',
        details: error
      });
    }
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): Database {
    if (!this.db || !this.isInitialized) {
      throw new DatabaseError({
        type: DatabaseErrorType.CONNECTION_FAILED,
        message: '数据库未初始化，请先调用initialize()方法'
      });
    }
    return this.db;
  }

  /**
   * 执行SQL查询
   */
  public exec(sql: string, params?: any[]): unknown[] {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      
      if (params) {
        stmt.bind(params);
      }
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      
      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL查询执行失败:', error);
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: 'SQL查询执行失败',
        details: { sql, params, error }
      });
    }
  }

  /**
   * 执行SQL语句（不返回结果）
   */
  public run(sql: string, params?: unknown[]): void {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      
      if (params) {
        stmt.bind(params);
      }
      
      stmt.step();
      stmt.free();
    } catch (error) {
      console.error('SQL语句执行失败:', error);
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: 'SQL语句执行失败',
        details: { sql, params, error }
      });
    }
  }

  /**
   * 开始事务
   */
  public beginTransaction(): void {
    this.run('BEGIN TRANSACTION;');
  }

  /**
   * 提交事务
   */
  public commit(): void {
    this.run('COMMIT;');
  }

  /**
   * 回滚事务
   */
  public rollback(): void {
    this.run('ROLLBACK;');
  }

  /**
   * 执行事务
   */
  public async transaction<T>(callback: () => Promise<T> | T): Promise<T> {
    try {
      this.beginTransaction();
      const result = await callback();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw new DatabaseError({
        type: DatabaseErrorType.TRANSACTION_FAILED,
        message: '事务执行失败',
        details: error
      });
    }
  }

  /**
   * 保存数据库到localStorage
   */
  public saveToStorage(): void {
    try {
      const db = this.getDatabase();
      const data = db.export();
      const base64 = btoa(String.fromCharCode(...data));
      localStorage.setItem('english_learning_db', base64);
    } catch (error) {
      console.error('保存数据库失败:', error);
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '保存数据库失败',
        details: error
      });
    }
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.saveToStorage();
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    const tables = Object.values(DATABASE_SCHEMA);
    
    for (const tableSQL of tables) {
      this.run(tableSQL);
    }
  }

  /**
   * 创建数据库索引
   */
  private async createIndexes(): Promise<void> {
    for (const indexSQL of DATABASE_INDEXES) {
      this.run(indexSQL);
    }
  }

  /**
   * 创建数据库触发器
   */
  private async createTriggers(): Promise<void> {
    for (const triggerSQL of DATABASE_TRIGGERS) {
      this.run(triggerSQL);
    }
  }
}