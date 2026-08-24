import type { QualityReport } from '../lib/qualityCheck';
import styles from './QualityCheck.module.css';

const VERDICT_META = {
  pass: { label: '可以生成', tone: 'pass' },
  warn: { label: '可以尝试,但建议改进', tone: 'warn' },
  reject: { label: '当前照片无法生成', tone: 'fail' },
} as const;

const STATUS_ICON = { pass: '✓', warn: '!', fail: '✕' } as const;

export function QualityCheck({ report }: { report: QualityReport }) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.verdict} ${styles[VERDICT_META[report.verdict].tone]}`}>
        {VERDICT_META[report.verdict].label}
      </div>
      <ul className={styles.items}>
        {report.items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={`${styles.dot} ${styles[item.status]}`}>{STATUS_ICON[item.status]}</span>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.message}>{item.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
