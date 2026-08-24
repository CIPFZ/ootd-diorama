import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoImport } from '../components/PhotoImport';
import { QualityCheck } from '../components/QualityCheck';
import { checkPhoto } from '../lib/qualityCheck';
import type { QualityReport } from '../lib/qualityCheck';
import { createTask } from '../api/tasks';
import { useUiStore } from '../stores/uiStore';
import styles from './ImportPage.module.css';

export function ImportPage() {
  const navigate = useNavigate();
  const debugMode = useUiStore((s) => s.debugMode);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const handleSelect = async (f: File) => {
    setFile(f);
    setError(null);
    setChecking(true);
    const r = await checkPhoto(f);
    setReport(r);
    setChecking(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const task = await createTask(file, { fail: simulateFail });
      navigate(`/task/${task.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
      setSubmitting(false);
    }
  };

  const canSubmit = report != null && report.verdict !== 'reject';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>拍摄 / 导入今日穿搭</h1>
        <p className={styles.sub}>选择一张全身照,生成你的今日 OOTD 立体形象</p>
      </header>

      <PhotoImport previewUrl={previewUrl} onSelect={handleSelect} />

      {checking && <p className={styles.checking}>正在检查照片…</p>}

      {report && !checking && (
        <>
          <QualityCheck report={report} />

          {debugMode && (
            <label className={styles.debug}>
              <input
                type="checkbox"
                checked={simulateFail}
                onChange={(e) => setSimulateFail(e.target.checked)}
              />
              模拟生成失败(验证失败与重试)
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting ? '提交中…' : '开始生成'}
            </button>
            {report.verdict === 'reject' && (
              <p className={styles.blocked}>请先替换为符合要求的照片</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
