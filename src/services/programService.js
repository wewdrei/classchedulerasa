import { apiFetch } from '../api';

export const programService = {
  // Get all programs
  async getPrograms() {
    const response = await apiFetch('/api/programs');
    if (!response.ok) {
      throw new Error('Failed to fetch programs');
    }
    return await response.json();
  },

  // Get a specific program by ID
  async getProgram(programId) {
    const response = await apiFetch(`/api/programs/${programId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch program');
    }
    return await response.json();
  },

  // Create a new program
  async createProgram(programData) {
    const response = await apiFetch('/api/programs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData)
    });
    if (!response.ok) {
      throw new Error('Failed to create program');
    }
    return await response.json();
  },

  // Update a program
  async updateProgram(programId, programData) {
    const response = await apiFetch(`/api/programs/${programId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData)
    });
    if (!response.ok) {
      throw new Error('Failed to update program');
    }
    return await response.json();
  },

  // Delete a program
  async deleteProgram(programId) {
    const response = await apiFetch(`/api/programs/${programId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete program');
    }
    return true;
  },

  // Get program statistics/summary
  async getProgramStats(programId) {
    const response = await apiFetch(`/api/programs/${programId}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch program statistics');
    }
    return await response.json();
  }
};