async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let message = `请求失败 (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body.detail != null) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // 忽略非 JSON 响应,保留默认错误信息
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export { request };
