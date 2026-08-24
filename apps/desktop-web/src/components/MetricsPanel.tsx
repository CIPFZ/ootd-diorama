import type { TaskMetrics } from '../api/types';
import { STAGES, STAGE_LABELS } from '../api/types';
import { formatBytes } from '../lib/format';
import styles from './MetricsPanel.module.css';

export function MetricsPanel({
  metrics,
  maxYawDeg,
}: {
  metrics: TaskMetrics;
  maxYawDeg: number;
}) {
  const durations = metrics.stageDurations;

  return (
    <section className={styles.panel}>
      <h3>处理指标</h3>
      <dl className={styles.grid}>
        <div>
          <dt>面数</dt>
          <dd>{metrics.faceCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>贴图</dt>
          <dd>{metrics.textureSize || '—'}</dd>
        </div>
        <div>
          <dt>GLB 大小</dt>
          <dd>{formatBytes(metrics.glbSizeBytes)}</dd>
        </div>
        <div>
          <dt>建议转角</dt>
          <dd>±{maxYawDeg}°</dd>
        </div>
      </dl>
      <ul className={styles.durations}>
        {STAGES.map((stage) => (
          <li key={stage}>
            <span>{STAGE_LABELS[stage]}</span>
            <span>
              {durations[stage] != null ? `${Math.round(durations[stage]! * 1000)} ms` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
