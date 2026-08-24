import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import styles from './PhotoImport.module.css';

interface PhotoImportProps {
  previewUrl: string | null;
  onSelect: (file: File) => void;
}

export function PhotoImport({ previewUrl, onSelect }: PhotoImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (f: File | undefined) => {
      if (f) onSelect(f);
    },
    [onSelect],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  return (
    <div
      className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {previewUrl ? (
        <img className={styles.preview} src={previewUrl} alt="已选择的照片" />
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.icon}>＋</div>
          <p className={styles.title}>选择一张全身穿搭照片</p>
          <p className={styles.hint}>点击或拖拽到此处 · 支持 JPG / PNG / WebP</p>
        </div>
      )}
    </div>
  );
}
