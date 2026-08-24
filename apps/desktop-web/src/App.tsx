import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { ImportPage } from './pages/ImportPage';
import { TaskProgressPage } from './pages/TaskProgressPage';
import { ResultPage } from './pages/ResultPage';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.shell}>
        <TopBar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<ImportPage />} />
            <Route path="/task/:id" element={<TaskProgressPage />} />
            <Route path="/result/:id" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
