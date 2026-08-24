import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { TaskStageTimeline } from '../components/TaskStageTimeline';
import { cancelTask, regenerateTask } from '../api/tasks';
import { STATUS_LABELS } from '../api/types';
import styles from './TaskProgressPage.module.css';

export function TaskProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading, isError, error } = useTask(id);

  useEffect(() => {
    if (task?.status === 'succeeded') {
      navigate(`/result/${task.id}`, { replace: true });
    }
  }, [task, navigate]);

  const handleCancel = async () => {
    if (id) await cancelTask(id);
  };

  const handleRetry = async () => {
    if (!id) return;
    const next = await regenerateTask(id);
    navigate(`/task/${next.id}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.state}>加载任务…</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className={styles.page}>
        <p className={styles.state}>
          无法加载任务:{error instanceof Error ? error.message : '未知错误'}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={() => navigate('/')}>
            返回
          </button>
        </div>
      </div>
    );
  }

  const isActive = task.status === 'pending' || task.status === 'processing';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{STATUS_LABELS[task.status]}</h1>
        <p className={styles.sub}>
          {isActive ? '正在处理,请稍候(不显示虚假进度百分比)' : ''}
        </p>
      </header>

      <TaskStageTimeline task={task} />

      {task.sourceImageUrl && (
        <img className={styles.source} src={task.sourceImageUrl} alt="原图" />
      )}

      {task.status === 'failed' && task.error && (
        <div className={styles.error}>
          <strong>生成失败</strong>
          <p>
            {task.error.message}（{task.error.code}）
          </p>
          <button type="button" onClick={handleRetry}>
            重试
          </button>
        </div>
      )}

      {task.status === 'cancelled' && (
        <div className={styles.cancelled}>
          <p>任务已取消</p>
          <button type="button" onClick={handleRetry}>
            重新生成
          </button>
        </div>
      )}

      <div className={styles.actions}>
        {isActive && (
          <button type="button" onClick={handleCancel}>
            取消任务
          </button>
        )}
        <button type="button" onClick={() => navigate('/')}>
          返回
        </button>
      </div>
    </div>
  );
}
