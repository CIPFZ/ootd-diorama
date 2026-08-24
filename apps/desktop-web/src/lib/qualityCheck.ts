export interface QualityCheckItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface QualityReport {
  verdict: 'pass' | 'warn' | 'reject';
  items: QualityCheckItem[];
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * 前端基础质量检查(格式 / 大小 / 能否解码 / 分辨率)。
 * 真实管线就绪后,更细的人物检测、全身完整度检查会移到后端。
 */
export async function checkPhoto(file: File): Promise<QualityReport> {
  const items: QualityCheckItem[] = [];

  if (SUPPORTED_TYPES.includes(file.type)) {
    items.push({ id: 'type', label: '图片格式', status: 'pass', message: file.type });
  } else {
    items.push({
      id: 'type',
      label: '图片格式',
      status: 'fail',
      message: `不支持的格式(${file.type || '未知'}),请使用 JPG / PNG / WebP`,
    });
  }

  const mb = file.size / 1024 / 1024;
  if (mb > 30) {
    items.push({
      id: 'size',
      label: '文件大小',
      status: 'fail',
      message: `${mb.toFixed(1)} MB,过大,请使用 30MB 以内的图片`,
    });
  } else if (mb > 15) {
    items.push({
      id: 'size',
      label: '文件大小',
      status: 'warn',
      message: `${mb.toFixed(1)} MB,偏大,可能影响上传`,
    });
  } else {
    items.push({ id: 'size', label: '文件大小', status: 'pass', message: `${mb.toFixed(1)} MB` });
  }

  let width = 0;
  let height = 0;
  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch {
    items.push({
      id: 'decode',
      label: '图片解析',
      status: 'fail',
      message: '无法解析该图片,文件可能已损坏',
    });
  }

  if (width && height) {
    const minSide = Math.min(width, height);
    if (minSide < 480) {
      items.push({
        id: 'resolution',
        label: '分辨率',
        status: 'warn',
        message: `${width}×${height},分辨率偏低,建模效果可能不理想`,
      });
    } else {
      items.push({ id: 'resolution', label: '分辨率', status: 'pass', message: `${width}×${height}` });
    }
  }

  const verdict: QualityReport['verdict'] = items.some((i) => i.status === 'fail')
    ? 'reject'
    : items.some((i) => i.status === 'warn')
      ? 'warn'
      : 'pass';

  return { verdict, items };
}
