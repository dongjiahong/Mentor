import { render, screen } from '@testing-library/react';
import { LearningPage } from '../LearningPage';

describe('LearningPage', () => {
  it('renders learning page content', () => {
    render(<LearningPage />);

    // 检查页面标题
    expect(screen.getByText('开始学习')).toBeInTheDocument();
    expect(screen.getByText('选择学习内容类型，开始您的英语学习之旅')).toBeInTheDocument();

    // 检查学习选项
    expect(screen.getByText('对话练习')).toBeInTheDocument();
    expect(screen.getByText('文章阅读')).toBeInTheDocument();

    // 检查按钮
    expect(screen.getByText('开始对话练习')).toBeInTheDocument();
    expect(screen.getByText('开始阅读练习')).toBeInTheDocument();

    // 检查功能介绍
    expect(screen.getByText('学习功能')).toBeInTheDocument();
    expect(screen.getByText('TTS语音播放')).toBeInTheDocument();
    expect(screen.getByText('发音练习评估')).toBeInTheDocument();
    expect(screen.getByText('智能单词本')).toBeInTheDocument();
  });
});