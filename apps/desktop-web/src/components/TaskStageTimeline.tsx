import { STAGES, STAGE_LABELS } from '../api/types';
import type { Task } from '../api/types';
import styles from './TaskStageTimeline.module.css';

export function TaskStageTimeline({ task }: { task: Task }) {
  const currentIndex = task.stage ? STAGES.indexOf(task.stage) : -1;

  return (
    <ol className={styles.timeline}>
      {STAGES.map((stage, index) => {
        let state: 'done' | 'active' | 'pending' = 'pending';
        if (task.status === 'succeeded') state = 'done';
        else if (index < currentIndex) state = 'done';
        else if (index === currentIndex) state = 'active';

        return (
          <li key={stage} className={`${styles.step} ${styles[state]}`}>
            <span className={styles.marker} />
            <span className={styles.name}>{STAGE_LABELS[stage]}</span>
          </li>
        );
      })}
    </ol>
  );
}
