import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LearningPage } from './pages/LearningPage';
import { WordbookPage } from './pages/WordbookPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { DictionaryDemoPage } from './pages/DictionaryDemoPage';
import { useTheme } from './hooks';
import './App.css';

function App() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Router>
      <Layout onThemeToggle={toggleTheme} isDarkMode={isDarkMode}>
        <Routes>
          <Route path="/" element={<LearningPage />} />
          <Route path="/wordbook" element={<WordbookPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dictionary-demo" element={<DictionaryDemoPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
