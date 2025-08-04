import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SettingsPage } from '../SettingsPage';

// Mock hooks
vi.mock('@/hooks', () => ({
  useSettings: vi.fn(),
  useTheme: vi.fn()
}));

// Mock UI components
vi.mock('@/components/ui/FormField', () => ({
  FormField: ({ label, children }: any) => (
    <div data-testid={`form-field-${label}`}>
      <label>{label}</label>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ options, value, onChange, placeholder }: any) => (
    <select 
      data-testid="select"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input 
      data-testid="input"
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, loading, disabled }: any) => (
    <button 
      data-testid="button"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid={`alert-${variant}`}>
      {children}
    </div>
  )
}));

describe('SettingsPage', () => {
  const mockUseSettings = {
    userProfile: null,
    aiConfig: null,
    formData: {
      englishLevel: 'A1',
      learningGoal: 'daily_conversation',
      apiUrl: 'https://api.openai.com/v1',
      apiKey: '',
      modelName: 'gpt-3.5-turbo'
    },
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    updateFormData: vi.fn(),
    saveSettings: vi.fn(),
    testAIConnection: vi.fn(),
    resetForm: vi.fn(),
    clearError: vi.fn()
  };

  const mockUseTheme = {
    theme: 'system',
    setTheme: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { useSettings } = require('@/hooks');
    const { useTheme } = require('@/hooks');
    
    useSettings.mockReturnValue(mockUseSettings);
    useTheme.mockReturnValue(mockUseTheme);
  });

  it('应该渲染设置页面标题', () => {
    render(<SettingsPage />);
    
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('个性化您的学习体验')).toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    const { useSettings } = require('@/hooks');
    useSettings.mockReturnValue({
      ...mockUseSettings,
      isLoading: true,
      userProfile: null,
      aiConfig: null
    });

    render(<SettingsPage />);
    
    expect(screen.getByText('加载设置中...')).toBeInTheDocument();
  });

  it('应该显示错误信息', () => {
    const { useSettings } = require('@/hooks');
    useSettings.mockReturnValue({
      ...mockUseSettings,
      error: {
        type: 'DATABASE_ERROR',
        message: '数据库连接失败'
      }
    });

    render(<SettingsPage />);
    
    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    expect(screen.getByText('数据库连接失败')).toBeInTheDocument();
  });

  it('应该渲染用户配置表单', () => {
    render(<SettingsPage />);
    
    expect(screen.getByTestId('form-field-英语水平')).toBeInTheDocument();
    expect(screen.getByTestId('form-field-学习目标')).toBeInTheDocument();
  });

  it('应该渲染AI配置表单', () => {
    render(<SettingsPage />);
    
    expect(screen.getByTestId('form-field-API URL')).toBeInTheDocument();
    expect(screen.getByTestId('form-field-API Key')).toBeInTheDocument();
    expect(screen.getByTestId('form-field-模型名称')).toBeInTheDocument();
  });

  it('应该处理表单数据更新', () => {
    render(<SettingsPage />);
    
    const selects = screen.getAllByTestId('select');
    fireEvent.change(selects[0], { target: { value: 'B1' } });
    
    expect(mockUseSettings.updateFormData).toHaveBeenCalledWith({
      englishLevel: 'B1'
    });
  });

  it('应该处理AI连接测试', async () => {
    mockUseSettings.testAIConnection.mockResolvedValue({
      isValid: true,
      errors: []
    });

    render(<SettingsPage />);
    
    const testButton = screen.getByText('测试连接');
    fireEvent.click(testButton);
    
    expect(mockUseSettings.testAIConnection).toHaveBeenCalled();
  });

  it('应该处理设置保存', async () => {
    const { useSettings } = require('@/hooks');
    useSettings.mockReturnValue({
      ...mockUseSettings,
      hasUnsavedChanges: true
    });

    mockUseSettings.saveSettings.mockResolvedValue(true);

    render(<SettingsPage />);
    
    const saveButton = screen.getByText('保存设置');
    fireEvent.click(saveButton);
    
    expect(mockUseSettings.saveSettings).toHaveBeenCalled();
  });

  it('应该处理主题切换', () => {
    render(<SettingsPage />);
    
    const darkThemeRadio = screen.getByDisplayValue('dark');
    fireEvent.click(darkThemeRadio);
    
    expect(mockUseTheme.setTheme).toHaveBeenCalledWith('dark');
  });

  it('应该显示未保存更改提示', () => {
    const { useSettings } = require('@/hooks');
    useSettings.mockReturnValue({
      ...mockUseSettings,
      hasUnsavedChanges: true
    });

    render(<SettingsPage />);
    
    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
    expect(screen.getByText(/您有未保存的更改/)).toBeInTheDocument();
  });

  it('应该在没有必填字段时禁用测试连接按钮', () => {
    const { useSettings } = require('@/hooks');
    useSettings.mockReturnValue({
      ...mockUseSettings,
      formData: {
        ...mockUseSettings.formData,
        apiKey: '' // 空的API Key
      }
    });

    render(<SettingsPage />);
    
    const testButton = screen.getByText('测试连接');
    expect(testButton).toBeDisabled();
  });

  it('应该在没有未保存更改时禁用保存按钮', () => {
    render(<SettingsPage />);
    
    const saveButton = screen.getByText('保存设置');
    expect(saveButton).toBeDisabled();
  });
});