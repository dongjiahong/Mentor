import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';

const MockLayout = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Layout onThemeToggle={() => {}} isDarkMode={false}>
      {children}
    </Layout>
  </BrowserRouter>
);

describe('Layout', () => {
  it('renders header, main content, and footer', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );

    // 检查是否渲染了主要元素
    expect(screen.getAllByText('英语学习助手')).toHaveLength(2); // Header和Footer中都有
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('基于AI的个性化英语学习平台')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );

    // 检查导航链接
    expect(screen.getByText('学习')).toBeInTheDocument();
    expect(screen.getByText('单词本')).toBeInTheDocument();
    expect(screen.getByText('成长报告')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
  });
});