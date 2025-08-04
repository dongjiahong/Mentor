import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { WordPopover } from '../WordPopover';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

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

describe('WordPopover', () => {
  const mockPosition = { x: 100, y: 100 };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByText('查询中...')).toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('查询中...')).toBeInTheDocument();
  });

  it('应该在加载完成后显示单词定义', async () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // 应该显示词性和释义
    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
  });

  it('应该支持播放发音', async () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
    
    // 点击播放按钮（通过查找包含Volume2图标的按钮）
    const playButtons = screen.getAllByRole('button');
    const playButton = playButtons.find(button => 
      button.querySelector('svg.lucide-volume2')
    );
    expect(playButton).toBeTruthy();
    if (playButton) {
      fireEvent.click(playButton);
    }
    
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('应该支持关闭弹窗', async () => {
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    // 点击关闭按钮（通过查找包含X图标的按钮）
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(button => 
      button.querySelector('svg.lucide-x')
    );
    expect(closeButton).toBeTruthy();
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
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
    
    // 点击外部区域
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该支持添加到单词本', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <WordPopover 
        word="test" 
        position={mockPosition} 
        onClose={mockOnClose} 
      />
    );
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
    
    // 点击添加到单词本按钮
    const addButton = screen.getByText('添加到单词本');
    fireEvent.click(addButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('添加到单词本:', 'test');
    expect(mockOnClose).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});