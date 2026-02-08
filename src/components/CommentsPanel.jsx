import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { apiFetch } from '../api';

export default function CommentsPanel({ programId, indicatorId, documentId }) {
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState('');
  const [isNA, setIsNA] = useState(false);
  const [ratingComment, setRatingComment] = useState('');

  // Determine context (indicator vs document)
  const contextId = indicatorId || documentId;
  const contextType = indicatorId ? 'indicator' : 'document';
  const contextLabel = indicatorId ? `Indicator ${indicatorId}` : `Document ${documentId}`;

  const loadData = async () => {
    if (!contextId) return;
    setLoading(true);
    setError(null);
    try {
      // Load comments
      const commentsRes = await apiFetch(`/api/${contextType}s/${contextId}/comments`);
      if (!commentsRes.ok) throw new Error('Failed to load comments');
      const commentsData = await commentsRes.json();
      setComments(commentsData);

      // Load ratings (only for indicators)
      if (contextType === 'indicator') {
        const ratingsRes = await apiFetch(`/api/indicators/${contextId}/ratings`);
        if (!ratingsRes.ok) throw new Error('Failed to load ratings');
        const ratingsData = await ratingsRes.json();
        setRatings(ratingsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contextId, contextType]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/${contextType}s/${contextId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: newComment.trim() })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const comment = await res.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    if (!isNA && !newRating) return;
    setSubmitting(true);
    try {
      const payload = {
        is_na: isNA,
        comment: ratingComment || null
      };
      if (!isNA && newRating) {
        payload.rating = parseInt(newRating);
      }
      
      const res = await apiFetch(`/api/indicators/${contextId}/ratings`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit rating');
      await loadData(); // Refresh ratings list
      setNewRating('');
      setIsNA(false);
      setRatingComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!contextId) {
    return (
      <div className="card">
        <div className="card-header">Comments & Ratings</div>
        <div className="card-body text-muted small">
          Select an indicator or document to view engagement.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Comments & Ratings</span>
        <small className="text-muted">{contextLabel}</small>
      </div>
      <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {loading && <div className="text-center"><Spinner size="sm" /> Loading...</div>}
        {error && <Alert variant="danger" className="small">{error}</Alert>}
        
        {!loading && (
          <>
            {/* Add Comment Form */}
            <Form onSubmit={handleAddComment} className="mb-3">
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Add Comment</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  disabled={submitting}
                  style={{ fontSize: '0.9rem' }}
                />
              </Form.Group>
              <Button 
                type="submit" 
                size="sm" 
                disabled={submitting || !newComment.trim()}
                style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}
              >
                {submitting ? <Spinner size="sm" /> : 'Add Comment'}
              </Button>
            </Form>

            {/* Add Rating Form (indicators only) */}
            {contextType === 'indicator' && (
              <Form onSubmit={handleAddRating} className="mb-3 border-top pt-3">
                <Form.Label className="small fw-bold">Add Rating</Form.Label>
                <div className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Mark as Not Applicable (N/A)"
                    checked={isNA}
                    onChange={(e) => setIsNA(e.target.checked)}
                    className="small"
                  />
                </div>
                {!isNA && (
                  <Form.Group className="mb-2">
                    <Form.Select
                      size="sm"
                      value={newRating}
                      onChange={(e) => setNewRating(e.target.value)}
                    >
                      <option value="">Select rating (1-5)</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very Good</option>
                      <option value="5">5 - Excellent</option>
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group className="mb-2">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Optional comment for this rating..."
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={submitting || (!isNA && !newRating)}
                  variant="primary"
                >
                  {submitting ? <Spinner size="sm" /> : 'Submit Rating'}
                </Button>
              </Form>
            )}

            {/* Ratings List (indicators only) */}
            {contextType === 'indicator' && ratings.length > 0 && (
              <div className="mb-3 border-top pt-3">
                <div className="small fw-bold mb-2">Ratings</div>
                {ratings.map((rating, idx) => (
                  <div key={idx} className="small mb-2 p-2 bg-light rounded">
                    <div className="d-flex justify-content-between">
                      <strong>{rating.user?.name || 'Unknown User'}</strong>
                      <span className="text-muted">
                        {rating.is_na ? 'N/A' : `${rating.rating}/5`}
                      </span>
                    </div>
                    {rating.comment && <div className="text-muted mt-1">{rating.comment}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Comments List */}
            <div className="border-top pt-3">
              <div className="small fw-bold mb-2">Comments ({comments.length})</div>
              {comments.length === 0 && (
                <div className="text-muted small">No comments yet.</div>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="small mb-3 p-2 bg-light rounded">
                  <div className="d-flex justify-content-between mb-1">
                    <strong>{comment.user?.name || 'Unknown User'}</strong>
                    <small className="text-muted">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div>{comment.body}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}