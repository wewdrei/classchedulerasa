import { apiFetch } from '../api';

export const listIndicatorComments = async (id) => {
  const response = await apiFetch(`/api/indicators/${id}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return await response.json();
};

export const addIndicatorComment = async (id, body) => {
  const response = await apiFetch(`/api/indicators/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return await response.json();
};

export const listDocumentComments = async (id) => {
  const response = await apiFetch(`/api/documents/${id}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return await response.json();
};

export const addDocumentComment = async (id, body) => {
  const response = await apiFetch(`/api/documents/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return await response.json();
};
