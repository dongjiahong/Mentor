import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LearningPage } from './pages/LearningPage';
import { WordbookPage } from './pages/WordbookPage';
import { WordbookReviewPage } from './pages/WordbookReviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { DictionaryDemoPage } from './pages/DictionaryDemoPage';
import { DatabaseTestPage } from './pages/DatabaseTestPage';
import { TTSTestPage } from './pages/TTSTestPage';
import { TTSDebugPage } from './pages/TTSDebugPage';
import { VoiceRecorderTestPage } from './pages/VoiceRecorderTestPage';
import { STTDebugPage } from './pages/STTDebugPage';
import { PronunciationPracticePage } from './pages/PronunciationPracticePage';
import { PronunciationTestPage } from './pages/PronunciationTestPage';
import { DevNavigationPage } from './pages/DevNavigationPage';
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
          <Route path="/wordbook/review" element={<WordbookReviewPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dictionary-demo" element={<DictionaryDemoPage />} />
          <Route path="/database-test" element={<DatabaseTestPage />} />
          <Route path="/tts-test" element={<TTSTestPage />} />
          <Route path="/tts-debug" element={<TTSDebugPage />} />
          <Route path="/voice-recorder-test" element={<VoiceRecorderTestPage />} />
          <Route path="/stt-debug" element={<STTDebugPage />} />
          <Route path="/pronunciation-practice" element={<PronunciationPracticePage />} />
          <Route path="/pronunciation-test" element={<PronunciationTestPage />} />
          <Route path="/dev-nav" element={<DevNavigationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
