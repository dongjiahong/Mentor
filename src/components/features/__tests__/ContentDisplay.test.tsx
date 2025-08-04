import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ContentDisplay } from '../ContentDisplay';
import { LearningContent } from '@/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

const mockContent: LearningContent = {
  id: 1,
  contentType: 'article',
  originalText: 'Hello world. This is a test sentence.',
  translation: '你好世界。这是一个测试句子。',
  difficultyLevel: 'B1',
  topic: '测试文章',
  createdAt: new Date()
};

describe('ContentDisplay', () => {
  it('应该正确渲染内容', () => {
    render(<ContentDisplay content={mockContent} />);
    
    expect(screen.getByText('文章阅读')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('测试文章')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('应该支持显示/隐藏翻译', async () => {
    render(<ContentDisplay content={mockContent} />);
    
    // 初始状态不显示翻译
    expect(screen.queryByText('你好世界。')).not.toBeInTheDocument();
    
    // 点击显示翻译按钮
    const toggleButton = screen.getByText('显示翻译');
    fireEvent.click(toggleButton);
    
    // 应该显示翻译
    await waitFor(() => {
      expect(screen.getByText('你好世界。')).toBeInTheDocument();
    });
    
    // 按钮文本应该变为"隐藏翻译"
    expect(screen.getByText('隐藏翻译')).toBeInTheDocument();
  });

  it('应该调用单词点击回调', () => {
    const mockWordClick = vi.fn();
    render(<ContentDisplay content={mockContent} onWordClick={mockWordClick} />);
    
    // 点击单词
    const wordElement = screen.getByText('Hello');
    fireEvent.click(wordElement);
    
    expect(mockWordClick).toHaveBeenCalledWith('hello');
  });

  it('应该调用句子播放回调', () => {
    const mockSentencePlay = vi.fn();
    render(<ContentDisplay content={mockContent} onSentencePlay={mockSentencePlay} />);
    
    // 查找第一个播放按钮
    const playButtons = screen.getAllByTitle('播放这句话');
    expect(playButtons.length).toBeGreaterThan(0);
    
    // 点击第一个播放按钮
    fireEvent.click(playButtons[0]);
    expect(mockSentencePlay).toHaveBeenCalled();
  });

  it('应该调用全文播放回调', () => {
    const mockFullTextPlay = vi.fn();
    render(<ContentDisplay content={mockContent} onFullTextPlay={mockFullTextPlay} />);
    
    const playButton = screen.getByText('播放全文');
    fireEvent.click(playButton);
    
    expect(mockFullTextPlay).toHaveBeenCalled();
  });

  it('应该正确显示对话类型内容', () => {
    const dialogueContent: LearningContent = {
      ...mockContent,
      contentType: 'dialogue'
    };
    
    render(<ContentDisplay content={dialogueContent} />);
    
    expect(screen.getByText('对话练习')).toBeInTheDocument();
  });
});