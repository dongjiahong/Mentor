import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseConnection } from '../connection';
import { DatabaseErrorType } from '@/types';

// Mock sql.js
vi.mock('sql.js', () => ({
  default: vi.fn(() => Promise.resolve({
    Database: vi.fn().mockImplementation(() => ({
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn(),
        step: vi.fn().mockReturnValue(false),
        getAsObject: vi.fn().mockReturnValue({}),
        free: vi.fn()
      }),
      export: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      close: vi.fn()
    }))
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('DatabaseConnection', () => {
  let dbConnection: DatabaseConnection;

  beforeEach(() => {
    // 重置单例实例
    (DatabaseConnection as any).instance = undefined;
    dbConnection = DatabaseConnection.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (dbConnection) {
      dbConnection.close();
    }
  });

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('应该成功初始化数据库', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      await expect(dbConnection.initialize()).resolves.not.toThrow();
    });

    it('应该从localStorage恢复现有数据库', async () => {
      const mockDbData = btoa('mock database data');
      localStorageMock.getItem.mockReturnValue(mockDbData);
      
      await expect(dbConnection.initialize()).resolves.not.toThrow();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('english_learning_db');
    });

    it('初始化失败时应该抛出DatabaseError', async () => {
      // 模拟sql.js初始化失败
      vi.doMock('sql.js', () => ({
        default: vi.fn(() => Promise.reject(new Error('SQL.js initialization failed')))
      }));

      await expect(dbConnection.initialize()).rejects.toMatchObject({
        type: DatabaseErrorType.INITIALIZATION_FAILED,
        message: '数据库初始化失败'
      });
    });
  });

  describe('getDatabase', () => {
    it('未初始化时应该抛出错误', () => {
      expect(() => dbConnection.getDatabase()).toThrow();
    });

    it('初始化后应该返回数据库实例', async () => {
      await dbConnection.initialize();
      
      expect(() => dbConnection.getDatabase()).not.toThrow();
    });
  });

  describe('exec', () => {
    beforeEach(async () => {
      await dbConnection.initialize();
    });

    it('应该执行SQL查询并返回结果', () => {
      const mockResults = [{ id: 1, name: 'test' }];
      const mockStmt = {
        bind: vi.fn(),
        step: vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false),
        getAsObject: vi.fn().mockReturnValue(mockResults[0]),
        free: vi.fn()
      };
      
      const mockDb = dbConnection.getDatabase();
      (mockDb.prepare as any).mockReturnValue(mockStmt);

      const results = dbConnection.exec('SELECT * FROM test');
      
      expect(results).toEqual(mockResults);
      expect(mockStmt.free).toHaveBeenCalled();
    });

    it('应该支持参数绑定', () => {
      const mockStmt = {
        bind: vi.fn(),
        step: vi.fn().mockReturnValue(false),
        getAsObject: vi.fn(),
        free: vi.fn()
      };
      
      const mockDb = dbConnection.getDatabase();
      (mockDb.prepare as any).mockReturnValue(mockStmt);

      dbConnection.exec('SELECT * FROM test WHERE id = ?', [1]);
      
      expect(mockStmt.bind).toHaveBeenCalledWith([1]);
    });
  });

  describe('run', () => {
    beforeEach(async () => {
      await dbConnection.initialize();
    });

    it('应该执行SQL语句', () => {
      const mockStmt = {
        bind: vi.fn(),
        step: vi.fn(),
        free: vi.fn()
      };
      
      const mockDb = dbConnection.getDatabase();
      (mockDb.prepare as any).mockReturnValue(mockStmt);

      expect(() => dbConnection.run('INSERT INTO test VALUES (1)')).not.toThrow();
      expect(mockStmt.step).toHaveBeenCalled();
      expect(mockStmt.free).toHaveBeenCalled();
    });
  });

  describe('transaction', () => {
    beforeEach(async () => {
      await dbConnection.initialize();
    });

    it('应该成功执行事务', async () => {
      const mockStmt = {
        bind: vi.fn(),
        step: vi.fn(),
        free: vi.fn()
      };
      
      const mockDb = dbConnection.getDatabase();
      (mockDb.prepare as any).mockReturnValue(mockStmt);

      const callback = vi.fn().mockResolvedValue('success');
      
      const result = await dbConnection.transaction(callback);
      
      expect(result).toBe('success');
      expect(callback).toHaveBeenCalled();
    });

    it('失败时应该回滚事务', async () => {
      const mockStmt = {
        bind: vi.fn(),
        step: vi.fn(),
        free: vi.fn()
      };
      
      const mockDb = dbConnection.getDatabase();
      (mockDb.prepare as any).mockReturnValue(mockStmt);

      const callback = vi.fn().mockRejectedValue(new Error('Transaction failed'));
      
      await expect(dbConnection.transaction(callback)).rejects.toMatchObject({
        type: DatabaseErrorType.TRANSACTION_FAILED,
        message: '事务执行失败'
      });
    });
  });

  describe('saveToStorage', () => {
    beforeEach(async () => {
      await dbConnection.initialize();
    });

    it('应该将数据库保存到localStorage', () => {
      const mockData = new Uint8Array([1, 2, 3]);
      const mockDb = dbConnection.getDatabase();
      (mockDb.export as any).mockReturnValue(mockData);

      dbConnection.saveToStorage();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english_learning_db',
        btoa(String.fromCharCode(...mockData))
      );
    });
  });

  describe('close', () => {
    it('应该关闭数据库连接并保存数据', async () => {
      await dbConnection.initialize();
      const mockDb = dbConnection.getDatabase();
      
      dbConnection.close();
      
      expect(mockDb.close).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});