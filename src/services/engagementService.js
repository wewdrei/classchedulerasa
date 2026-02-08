import { apiFetch } from '../api';

export const engagementService = {
  // Indicators
  async getIndicators(areaId = null, parameterId = null) {
    const params = new URLSearchParams();
    if (areaId) params.append('area_id', areaId);
    if (parameterId) params.append('parameter_id', parameterId);
    
    const response = await apiFetch(`/api/indicators?${params}`);
    if (!response.ok) throw new Error('Failed to fetch indicators');
    return await response.json();
  },

  async getIndicatorsByArea(areaId) {
    const response = await apiFetch(`/api/areas/${areaId}/indicators`);
    if (!response.ok) throw new Error('Failed to fetch area indicators');
    return await response.json();
  },

  async getIndicatorDetails(indicatorId) {
    const response = await apiFetch(`/api/indicators/${indicatorId}`);
    if (!response.ok) throw new Error('Failed to fetch indicator details');
    return await response.json();
  },

  // Comments
  async getComments(entityId, entityType) {
    const base = entityType === 'sar-section' ? '/api/sar-sections' : `/api/${entityType}s`;
    const response = await apiFetch(`${base}/${entityId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return await response.json();
  },

  async addComment(commentData) {
    const { entity_type, entity_id, body } = commentData;
    const base = entity_type === 'sar-section' ? '/api/sar-sections' : `/api/${entity_type}s`;
    const response = await apiFetch(`${base}/${entity_id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return await response.json();
  },

  // Ratings
  async getRatings(indicatorId) {
    const response = await apiFetch(`/api/indicators/${indicatorId}/ratings`);
    if (!response.ok) throw new Error('Failed to fetch ratings');
    return await response.json();
  },

  async submitRating(ratingData) {
    const { indicator_id, rating, is_na, comment } = ratingData;
    const payload = { 
      is_na: is_na || false,
      comment: comment || null
    };
    
    if (!is_na && rating) {
      payload.rating = parseInt(rating);
    }

    const response = await apiFetch(`/api/indicators/${indicator_id}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to submit rating');
    return await response.json();
  },

  // Progress
  async getProgramProgress(programId) {
    const response = await apiFetch(`/api/programs/${programId}/progress`);
    if (!response.ok) throw new Error('Failed to fetch program progress');
    return await response.json();
  },

  // Notifications
  async getEngagementNotifications() {
    const response = await apiFetch('/api/notifications?types=comment,rating');
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return await response.json();
  },

  // SAR: Evidence
  async sarListEvidence(sectionId) {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/evidence`);
    if (!res.ok) throw new Error('Failed to load evidence');
    return await res.json();
  },
  async sarAttachEvidence(sectionId, documentId, note = '') {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, note })
    });
    if (!res.ok) throw new Error('Failed to attach evidence');
    return await res.json();
  },
  async sarDetachEvidence(sectionId, documentId) {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/evidence/${documentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove evidence');
    return true;
  },

  // SAR: Ratings
  async sarListRatings(sectionId) {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/ratings`);
    if (!res.ok) throw new Error('Failed to load ratings');
    return await res.json();
  },
  async sarUpsertRating(sectionId, score, remarks = '') {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, remarks })
    });
    if (!res.ok) throw new Error('Failed to submit rating');
    return await res.json();
  },

  // SAR: Reviewers
  async sarListReviewers(sarId) {
    const res = await apiFetch(`/api/sars/${sarId}/reviewers`);
    if (!res.ok) throw new Error('Failed to load reviewers');
    return await res.json();
  },
  async sarAssignReviewerToSar(sarId, userId, dueDate = null, role = null) {
    const res = await apiFetch(`/api/sars/${sarId}/reviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, due_date: dueDate, role })
    });
    if (!res.ok) throw new Error('Failed to assign reviewer');
    return await res.json();
  },
  async sarListSectionReviewers(sectionId) {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/reviewers`);
    if (!res.ok) throw new Error('Failed to load section reviewers');
    return await res.json();
  },
  async sarAssignReviewerToSection(sectionId, userId, dueDate = null, role = null) {
    const res = await apiFetch(`/api/sar-sections/${sectionId}/reviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, due_date: dueDate, role })
    });
    if (!res.ok) throw new Error('Failed to assign reviewer');
    return await res.json();
  },
  async sarRemoveAssignment(assignmentId) {
    const res = await apiFetch(`/api/reviewer-assignments/${assignmentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove assignment');
    return true;
  },

  // Users: Admins list (admin-only)
  async listAdmins() {
    const res = await apiFetch('/api/admins');
    if (!res.ok) throw new Error('Failed to load admins');
    return await res.json();
  }
};