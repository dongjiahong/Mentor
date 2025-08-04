import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TextRenderer } from '../TextRenderer';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

describe('TextRenderer', () => {
  const originalText = 'Hello world. This is a test sentence. How are you?';
  const translation = '你好世界。这是一个测试句子。你好吗？';

  it('应该正确渲染原文', () => {
    render(<TextRenderer originalText={originalText} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world.')).toBeInTheDocument();
    expect(screen.getByText('This')).toBeInTheDocument();
  });

  it('应该在提供翻译时显示翻译', () => {
    render(<TextRenderer originalText={originalText} translation={translation} />);
    
    expect(screen.getByText('你好世界。')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试句子。')).toBeInTheDocument();
  });

  it('应该支持单词点击', () => {
    const mockWordClick = vi.fn();
    render(
      <TextRenderer 
        originalText={originalText} 
        onWordClick={mockWordClick} 
      />
    );
    
    const wordElement = screen.getByText('Hello');
    fireEvent.click(wordElement);
    
    expect(mockWordClick).toHaveBeenCalledWith('hello', expect.any(Object));
  });

  it('应该支持句子播放', () => {
    const mockSentencePlay = vi.fn();
    render(
      <TextRenderer 
        originalText={originalText} 
        onSentencePlay={mockSentencePlay} 
      />
    );
    
    // 查找第一个播放按钮
    const playButtons = screen.getAllByTitle('播放这句话');
    expect(playButtons.length).toBeGreaterThan(0);
    
    // 点击第一个播放按钮
    fireEvent.click(playButtons[0]);
    expect(mockSentencePlay).toHaveBeenCalled();
  });

  it('应该正确分割句子', () => {
    render(<TextRenderer originalText={originalText} />);
    
    // 应该能找到所有单词
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('This')).toBeInTheDocument();
    expect(screen.getByText('How')).toBeInTheDocument();
  });

  it('应该只对英文单词添加点击事件', () => {
    const mockWordClick = vi.fn();
    const mixedText = 'Hello 世界 test.';
    
    render(
      <TextRenderer 
        originalText={mixedText} 
        onWordClick={mockWordClick} 
      />
    );
    
    // 点击英文单词应该触发回调
    const englishWord = screen.getByText('Hello');
    fireEvent.click(englishWord);
    expect(mockWordClick).toHaveBeenCalledWith('hello', expect.any(Object));
    
    // 重置mock
    mockWordClick.mockClear();
    
    // 点击中文字符不应该触发回调
    const chineseWord = screen.getByText('世界');
    fireEvent.click(chineseWord);
    expect(mockWordClick).not.toHaveBeenCalled();
  });

  it('应该处理空文本', () => {
    render(<TextRenderer originalText="" />);
    
    expect(screen.getByText('暂无内容')).toBeInTheDocument();
  });
});