import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { ModelViewer } from '../components/ModelViewer';
import { MetricsPanel } from '../components/MetricsPanel';
import { regenerateTask } from '../api/tasks';
import { formatDate } from '../lib/format';
import { useUiStore } from '../stores/uiStore';
import styles from './ResultPage.module.css';

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const debugMode = useUiStore((s) => s.debugMode);
  const { data: task, isLoading, isError } = useTask(id);
  const [compare, setCompare] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.state}>加载结果…</p>
      </div>
    );
  }

  if (isError || !task) {
    return <Navigate to="/" replace />;
  }

  if (task.status !== 'succeeded' || !task.result) {
    return <Navigate to={`/task/${task.id}`} replace />;
  }

  const result = task.result;

  const handleRegenerate = async () => {
    const next = await regenerateTask(task.id);
    navigate(`/task/${next.id}`);
  };

  const handleDelete = () => {
    if (window.confirm('删除这条记录?(原型阶段仅本地移除)')) {
      navigate('/');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>今日 OOTD</h1>
        <p className={styles.sub}>{formatDate(task.createdAt)}</p>
      </header>

      {compare && task.sourceImageUrl ? (
        <div className={styles.compare}>
          <figure className={styles.compareCell}>
            <img src={task.sourceImageUrl} alt="原图" />
            <figcaption>原图</figcaption>
          </figure>
          <figure className={styles.compareCell}>
            <ModelViewer
              glbUrl={result.glbUrl}
              previewUrl={result.previewUrl}
              maxYawDeg={result.maxYawDeg}
            />
            <figcaption>生成模型</figcaption>
          </figure>
        </div>
      ) : (
        <ModelViewer
          glbUrl={result.glbUrl}
          previewUrl={result.previewUrl}
          maxYawDeg={result.maxYawDeg}
        />
      )}

      <div className={styles.actions}>
        {task.sourceImageUrl && (
          <button type="button" onClick={() => setCompare((v) => !v)}>
            {compare ? '关闭对照' : '对照原图'}
          </button>
        )}
        <a className={styles.actionLink} href={result.previewUrl} download="ootd-preview.png">
          保存预览图
        </a>
        <button type="button" onClick={handleRegenerate}>
          重新生成
        </button>
        <button type="button" className={styles.danger} onClick={handleDelete}>
          删除记录
        </button>
      </div>

      {debugMode && <MetricsPanel metrics={result.metrics} maxYawDeg={result.maxYawDeg} />}
    </div>
  );
}
