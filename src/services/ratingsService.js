import { apiFetch } from '../api';

export const submitRating = async (id, payload) => {
  const response = await apiFetch(`/api/indicators/${id}/ratings`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to submit rating');
  return await response.json();
};

export const listRatings = async (id) => {
  const response = await apiFetch(`/api/indicators/${id}/ratings`);
  if (!response.ok) throw new Error('Failed to fetch ratings');
  return await response.json();
};
