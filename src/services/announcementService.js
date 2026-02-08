import { apiFetch } from '../api';

export const announcementService = {
  async getAll() {
    const res = await apiFetch('/api/announcements');
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return await res.json();
  },
  async get(id) {
    const res = await apiFetch(`/api/announcements/${id}`);
    if (!res.ok) throw new Error('Failed to fetch announcement');
    return await res.json();
  },
  async create(data) {
    const res = await apiFetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create announcement');
    return await res.json();
  },
  async update(id, data) {
    const res = await apiFetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update announcement');
    return await res.json();
  },
  async remove(id) {
    const res = await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete announcement');
    return true;
  }
};
