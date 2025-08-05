import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WordPopover } from '../WordPopover';
import { WordDefinition } from '@/types';

// Mock speechSynthesis
const mockSpeak = vi.fn();
const mockSpeechSynthesisUtterance = vi.fn();

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: mockSpeak,
  },
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance,
});

// Mock useDictionaryQuery hook
const mockLookupWord = vi.fn();
const mockGetWordPronunciation = vi.fn();
const mockClearQueryState = vi.fn();

const mockQueryState = {
  status: 'idle' as const,
  data: undefined,
  error: undefined,
  word: undefined,
};

vi.mock('@/hooks', () => ({
  useDictionaryQuery: () => ({
    lookupWord: mockLookupWord,
    getWordPronunciation: mockGetWordPronunciation,
    queryState: mockQueryState,
    clearQueryState: mockClearQueryState,
    isAvailable: true,
    serviceError: null,
  }),
}));

describe('WordPopover', () => {
  const mockPosition = { x: 100, y: 100 };
  const mockOnClose = vi.fn();
  const mockOnAddToWordbook = vi.fn();

  const mockDefinition: WordDefinition = {
    word: 'test',
    phonetic: '/test/',
    pronunciation: 'http://example.com/test.mp3',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '测试；试验',
        example: 'This is a test.'
      },
      {
        partOfSpeech: 'verb',
        meaning: '测试；检验',
        example: 'We need to test this feature.'
      }
    ],
    examples: [
      'The test was successful.',
      'Please test the application.'
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryState.status = 'idle';
    mockQueryState.data = undefined;
    mockQueryState.error = undefined;
  });

  it('应该正确渲染弹窗', () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('单词查询')).toBeInTheDocument();
  });

  it('应该在服务不可用时显示提示', () => {
    vi.mocked(vi.importActual('@/hooks')).useDictionaryQuery = () => ({
      lookupWord: mockLookupWord,
      getWordPronunciation: mockGetWordPronunciation,
      queryState: mockQueryState,
      clearQueryState: mockClearQueryState,
      isAvailable: false,
      serviceError: null,
    });

    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('词典服务未配置')).toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    mockQueryState.status = 'loading';
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('查询中...')).toBeInTheDocument();
  });

  it('应该显示错误状态', () => {
    mockQueryState.status = 'error';
    mockQueryState.error = {
      type: 'API_ERROR' as const,
      message: '查询失败',
      timestamp: new Date(),
      recoverable: false,
    };
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('查询失败')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('应该在查询成功后显示单词定义', () => {
    mockQueryState.status = 'success';
    mockQueryState.data = mockDefinition;
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('/test/')).toBeInTheDocument();
    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
    expect(screen.getByText('测试；试验')).toBeInTheDocument();
    expect(screen.getByText('测试；检验')).toBeInTheDocument();
  });

  it('应该支持播放发音', async () => {
    mockQueryState.status = 'success';
    mockQueryState.data = mockDefinition;
    mockGetWordPronunciation.mockResolvedValue('http://example.com/test.mp3');
    
    // Mock Audio
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    global.Audio = vi.fn().mockImplementation(() => ({
      play: mockPlay,
    }));
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    const playButton = screen.getByRole('button', { name: /volume/i });
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(mockGetWordPronunciation).toHaveBeenCalledWith('test');
    });
  });

  it('应该支持关闭弹窗', () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该支持点击外部关闭', () => {
    render(
      <div>
        <div data-testid="outside">外部区域</div>
        <WordPopover 
          word="test" 
          position={mockPosition} 
          onClose={mockOnClose} 
        />
      </div>
    );
    
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该支持添加到单词本', async () => {
    mockQueryState.status = 'success';
    mockQueryState.data = mockDefinition;
    mockOnAddToWordbook.mockResolvedValue(undefined);
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose}
        onAddToWordbook={mockOnAddToWordbook}
      />
    );
    
    const addButton = screen.getByText('添加到单词本');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(mockOnAddToWordbook).toHaveBeenCalledWith('test', mockDefinition);
    });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该在没有onAddToWordbook回调时隐藏添加按钮', () => {
    mockQueryState.status = 'success';
    mockQueryState.data = mockDefinition;
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose}
      />
    );
    
    expect(screen.queryByText('添加到单词本')).not.toBeInTheDocument();
  });

  it('应该在添加到单词本时显示加载状态', async () => {
    mockQueryState.status = 'success';
    mockQueryState.data = mockDefinition;
    
    // 模拟慢速的添加操作
    mockOnAddToWordbook.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose}
        onAddToWordbook={mockOnAddToWordbook}
      />
    );
    
    const addButton = screen.getByText('添加到单词本');
    fireEvent.click(addButton);
    
    expect(screen.getByText('添加中...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('应该正确计算弹窗位置', () => {
    const { container } = render(
      <WordPopover 
        word="test" 
        position={{ x: 50, y: 50 }} 
        onClose={mockOnClose} 
      />
    );
    
    const popover = container.firstChild as HTMLElement;
    expect(popover.style.position).toBe('fixed');
    expect(popover.style.left).toBe('10px'); // Math.max(10, 50 - 150) = 10
    expect(popover.style.top).toBe('40px'); // 50 - 10 = 40
  });
});