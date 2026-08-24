import { useUiStore } from '../stores/uiStore';
import styles from './TopBar.module.css';

export function TopBar() {
  const debugMode = useUiStore((s) => s.debugMode);
  const toggleDebugMode = useUiStore((s) => s.toggleDebugMode);

  return (
    <header className={styles.bar}>
      <span className={styles.brand}>OOTD 立体日记</span>
      <label className={styles.debugToggle}>
        <input type="checkbox" checked={debugMode} onChange={toggleDebugMode} />
        实验模式
      </label>
    </header>
  );
}
