import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from '../useSettings';

// Mock StorageService
vi.mock('@/services/storage/StorageService', () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    getUserProfile: vi.fn(),
    getAIConfig: vi.fn(),
    saveUserProfile: vi.fn(),
    saveAIConfig: vi.fn(),
    save: vi.fn()
  }))
}));

// Mock fetch for API testing
global.fetch = vi.fn();

describe('useSettings', () => {
  const mockStorageService = {
    initialize: vi.fn(),
    getUserProfile: vi.fn(),
    getAIConfig: vi.fn(),
    saveUserProfile: vi.fn(),
    saveAIConfig: vi.fn(),
    save: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { StorageService } = require('@/services/storage/StorageService');
    StorageService.mockImplementation(() => mockStorageService);
    
    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => useSettings());
    
    expect(result.current.userProfile).toBeNull();
    expect(result.current.aiConfig).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('应该加载现有设置', async () => {
    const mockUserProfile = {
      id: 1,
      englishLevel: 'B1' as const,
      learningGoal: 'business_english' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAIConfig = {
      id: 1,
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      modelName: 'gpt-4',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageService.getUserProfile.mockResolvedValue(mockUserProfile);
    mockStorageService.getAIConfig.mockResolvedValue(mockAIConfig);

    const { result } = renderHook(() => useSettings());

    // 等待加载完成
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.userProfile).toEqual(mockUserProfile);
    expect(result.current.aiConfig).toEqual(mockAIConfig);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.formData.englishLevel).toBe('B1');
    expect(result.current.formData.learningGoal).toBe('business_english');
    expect(result.current.formData.apiUrl).toBe('https://api.openai.com/v1');
    expect(result.current.formData.apiKey).toBe('sk-test');
    expect(result.current.formData.modelName).toBe('gpt-4');
  });

  it('应该处理加载错误', async () => {
    mockStorageService.initialize.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual({
      type: 'DATABASE_ERROR',
      message: '加载设置失败',
      details: expect.any(Error)
    });
  });

  it('应该更新表单数据', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateFormData({ englishLevel: 'C1' });
    });

    expect(result.current.formData.englishLevel).toBe('C1');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('应该保存设置', async () => {
    const mockUserProfile = {
      id: 1,
      englishLevel: 'B2' as const,
      learningGoal: 'academic_english' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAIConfig = {
      id: 1,
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-new',
      modelName: 'gpt-4-turbo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageService.saveUserProfile.mockResolvedValue(mockUserProfile);
    mockStorageService.saveAIConfig.mockResolvedValue(mockAIConfig);

    const { result } = renderHook(() => useSettings());

    // 更新表单数据
    act(() => {
      result.current.updateFormData({
        englishLevel: 'B2',
        learningGoal: 'academic_english',
        apiKey: 'sk-new',
        modelName: 'gpt-4-turbo'
      });
    });

    // 保存设置
    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.saveSettings();
    });

    expect(saveResult!).toBe(true);
    expect(mockStorageService.saveUserProfile).toHaveBeenCalledWith({
      englishLevel: 'B2',
      learningGoal: 'academic_english'
    });
    expect(mockStorageService.saveAIConfig).toHaveBeenCalledWith({
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-new',
      modelName: 'gpt-4-turbo'
    });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('应该处理保存错误', async () => {
    mockStorageService.saveUserProfile.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useSettings());

    // 更新表单数据
    act(() => {
      result.current.updateFormData({ englishLevel: 'C1' });
    });

    // 尝试保存设置
    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.saveSettings();
    });

    expect(saveResult!).toBe(false);
    expect(result.current.error).toEqual({
      type: 'DATABASE_ERROR',
      message: '保存设置失败',
      details: expect.any(Error)
    });
  });

  it('应该验证表单数据', async () => {
    const { result } = renderHook(() => useSettings());

    // 设置无效数据
    act(() => {
      result.current.updateFormData({
        apiUrl: 'invalid-url',
        apiKey: 'short',
        modelName: ''
      });
    });

    // 尝试保存
    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.saveSettings();
    });

    expect(saveResult!).toBe(false);
    expect(result.current.error?.type).toBe('VALIDATION_ERROR');
  });

  it('应该测试AI连接', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 'gpt-3.5-turbo' },
          { id: 'gpt-4' }
        ]
      })
    });

    const { result } = renderHook(() => useSettings());

    // 设置有效的API配置
    act(() => {
      result.current.updateFormData({
        apiUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-valid-key',
        modelName: 'gpt-3.5-turbo'
      });
    });

    let testResult: any;
    await act(async () => {
      testResult = await result.current.testAIConnection();
    });

    expect(testResult.isValid).toBe(true);
    expect(testResult.errors).toEqual([]);
  });

  it('应该处理AI连接测试失败', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('Invalid API key')
    });

    const { result } = renderHook(() => useSettings());

    // 设置API配置
    act(() => {
      result.current.updateFormData({
        apiUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-invalid',
        modelName: 'gpt-3.5-turbo'
      });
    });

    let testResult: any;
    await act(async () => {
      testResult = await result.current.testAIConnection();
    });

    expect(testResult.isValid).toBe(false);
    expect(testResult.errors).toContain('API连接失败: 401 Unauthorized');
  });

  it('应该重置表单', () => {
    const { result } = renderHook(() => useSettings());

    // 更新表单数据
    act(() => {
      result.current.updateFormData({ englishLevel: 'C2' });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // 重置表单
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.englishLevel).toBe('A1'); // 默认值
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('应该清除错误', () => {
    const { result } = renderHook(() => useSettings());

    // 模拟错误状态
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        error: { type: 'TEST_ERROR', message: 'Test error' }
      }));
    });

    // 清除错误
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});