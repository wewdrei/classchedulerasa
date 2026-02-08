import { apiFetch } from '../api';

export const messageService = {
  async getInbox() {
    const res = await apiFetch('/api/messages/inbox');
    if (!res.ok) throw new Error('Failed to fetch inbox');
    return await res.json();
  },
  async getOutbox() {
    const res = await apiFetch('/api/messages/outbox');
    if (!res.ok) throw new Error('Failed to fetch outbox');
    return await res.json();
  },
  async get(id) {
    const res = await apiFetch(`/api/messages/${id}`);
    if (!res.ok) throw new Error('Failed to fetch message');
    return await res.json();
  },
  async send(data) {
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to send message');
    return await res.json();
  },
  async remove(id) {
    const res = await apiFetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete message');
    return true;
  }
};
