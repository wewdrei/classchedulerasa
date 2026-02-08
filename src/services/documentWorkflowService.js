import { apiFetch } from '../api';

export const attachIndicator = async (docId, indicatorId) => {
  const response = await apiFetch(`/api/documents/${docId}/attach-indicator`, {
    method: 'POST',
    body: JSON.stringify({ indicator_id: indicatorId })
  });
  if (!response.ok) throw new Error('Failed to attach indicator');
  return await response.json();
};

export const detachIndicator = async (docId, indicatorId) => {
  const response = await apiFetch(`/api/documents/${docId}/detach-indicator/${indicatorId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to detach indicator');
  return await response.json();
};

export const submitDocument = async (docId) => {
  const response = await apiFetch(`/api/documents/${docId}/submit`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to submit document');
  return await response.json();
};

export const approveDocument = async (docId) => {
  const response = await apiFetch(`/api/documents/${docId}/approve`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to approve document');
  return await response.json();
};

export const requestRevision = async (docId) => {
  const response = await apiFetch(`/api/documents/${docId}/request-revision`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to request revision');
  return await response.json();
};

export const rejectDocument = async (docId) => {
  const response = await apiFetch(`/api/documents/${docId}/reject`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to reject document');
  return await response.json();
};
