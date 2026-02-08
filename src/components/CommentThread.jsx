import React, { useState } from 'react';
import { Form, Button, Alert, ListGroup, Badge, Card } from 'react-bootstrap';
import { engagementService } from '../services/engagementService';

export default function CommentThread({ entityType, entityId, comments = [], onCommentAdded, loading }) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const commentData = {
        body: newComment.trim(),
        entity_type: entityType,
        entity_id: entityId
      };

      const addedComment = await engagementService.addComment(commentData);
      onCommentAdded && onCommentAdded(addedComment);
      setNewComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="comment-thread">
      {/* Comment Form */}
      <Card className="mb-3">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="bi bi-chat-left-text me-2"></i>
                Add a Comment
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, feedback, or questions about this indicator..."
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Comments are visible to all team members working on this program.
              </Form.Text>
            </Form.Group>

            {error && (
              <Alert variant="danger" className="small">{error}</Alert>
            )}

            <div className="d-flex justify-content-end">
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting || !newComment.trim()}
                className="px-4"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Comments List */}
      <div className="comments-list">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">
            <i className="bi bi-chat-dots me-2"></i>
            Comments ({comments.length})
          </h6>
          {comments.length > 0 && (
            <small className="text-muted">
              Newest first
            </small>
          )}
        </div>

        {loading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm me-2" />
            Loading comments...
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center text-muted py-4">
            <i className="bi bi-chat-square fs-2 mb-2 d-block"></i>
            <p className="mb-1">No comments yet</p>
            <small>Start the conversation by adding the first comment above</small>
          </div>
        )}

        {!loading && comments.length > 0 && (
          <ListGroup variant="flush">
            {comments.map(comment => (
              <ListGroup.Item key={comment.id} className="px-0 py-3">
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0 me-3">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt={comment.user?.name || 'Avatar'}
                           className="rounded-circle" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
                    ) : (
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '36px', height: '36px', fontSize: '14px' }}
                      >
                        {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <strong className="me-2">
                          {comment.user?.name || 'Anonymous User'}
                        </strong>
                        {comment.user?.role && (
                          <Badge bg="outline-secondary" className="small">
                            {comment.user.role}
                          </Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {formatDate(comment.created_at)}
                      </small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {comment.body}
                    </p>
                    {comment.updated_at !== comment.created_at && (
                      <small className="text-muted">
                        <i className="bi bi-pencil me-1"></i>
                        Edited
                      </small>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </div>
  );
}