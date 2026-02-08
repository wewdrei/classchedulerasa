import { apiFetch } from '../api';

export async function fetchProgramProgress(programId) {
  const response = await apiFetch(`/api/programs/${programId}/progress`);
  if (!response.ok) {
    throw new Error('Failed to fetch program progress');
  }
  return await response.json();
}
