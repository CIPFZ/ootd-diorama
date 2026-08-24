import { request } from './client';
import type { Task } from './types';

export async function createTask(file: File, opts?: { fail?: boolean }): Promise<Task> {
  const form = new FormData();
  form.append('file', file);
  const query = opts?.fail ? '?fail=1' : '';
  return request<Task>(`/api/tasks${query}`, { method: 'POST', body: form });
}

export async function getTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`);
}

export async function cancelTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}/cancel`, { method: 'POST' });
}

export async function regenerateTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}/regenerate`, { method: 'POST' });
}
