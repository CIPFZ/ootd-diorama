// 与后端 services/reconstruction-api/app/schemas.py 对齐的契约。
// 后续可抽到 packages/asset-schema 统一管理。

export type Stage =
  | 'preprocessing'
  | 'analyzing'
  | 'fitting_body'
  | 'reconstructing_surface'
  | 'texturing'
  | 'optimizing';

export type Status = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface TaskError {
  code: string;
  message: string;
}

export interface StageDurations {
  preprocessing: number | null;
  analyzing: number | null;
  fitting_body: number | null;
  reconstructing_surface: number | null;
  texturing: number | null;
  optimizing: number | null;
}

export interface TaskMetrics {
  faceCount: number;
  textureSize: string;
  glbSizeBytes: number;
  stageDurations: StageDurations;
}

export interface TaskResult {
  glbUrl: string;
  previewUrl: string;
  thumbnailUrl: string;
  maxYawDeg: number;
  metrics: TaskMetrics;
}

export interface Task {
  id: string;
  status: Status;
  stage?: Stage;
  sourceImageUrl?: string;
  error?: TaskError;
  result?: TaskResult;
  createdAt: string;
}

export const STAGES: Stage[] = [
  'preprocessing',
  'analyzing',
  'fitting_body',
  'reconstructing_surface',
  'texturing',
  'optimizing',
];

export const STAGE_LABELS: Record<Stage, string> = {
  preprocessing: '预处理图片',
  analyzing: '分析人物与服装',
  fitting_body: '拟合人体',
  reconstructing_surface: '重建穿衣表面',
  texturing: '生成纹理',
  optimizing: '优化并导出',
};

export const STATUS_LABELS: Record<Status, string> = {
  pending: '排队中',
  processing: '处理中',
  succeeded: '已完成',
  failed: '失败',
  cancelled: '已取消',
};
