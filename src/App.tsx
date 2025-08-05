import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LearningPage } from './pages/LearningPage';
import { WordbookPage } from './pages/WordbookPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { DictionaryDemoPage } from './pages/DictionaryDemoPage';
import { DatabaseTestPage } from './pages/DatabaseTestPage';
import { TTSTestPage } from './pages/TTSTestPage';
import { TTSDebugPage } from './pages/TTSDebugPage';
import { VoiceRecorderTestPage } from './pages/VoiceRecorderTestPage';
import { STTDebugPage } from './pages/STTDebugPage';
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
          <Route path="/database-test" element={<DatabaseTestPage />} />
          <Route path="/tts-test" element={<TTSTestPage />} />
          <Route path="/tts-debug" element={<TTSDebugPage />} />
          <Route path="/voice-recorder-test" element={<VoiceRecorderTestPage />} />
          <Route path="/stt-debug" element={<STTDebugPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
