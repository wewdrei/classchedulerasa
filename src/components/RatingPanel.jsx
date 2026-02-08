import React, { useState } from 'react';
import { Form, Button, Alert, ListGroup, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import { engagementService } from '../services/engagementService';

const RATING_LEVELS = [
  { value: 1, label: 'Needs Improvement', color: 'danger', description: 'Significant gaps identified' },
  { value: 2, label: 'Developing', color: 'warning', description: 'Progress made, improvements needed' },
  { value: 3, label: 'Satisfactory', color: 'info', description: 'Meets basic requirements' },
  { value: 4, label: 'Good', color: 'primary', description: 'Exceeds basic requirements' },
  { value: 5, label: 'Excellent', color: 'success', description: 'Outstanding performance' }
];

export default function RatingPanel({ indicatorId, ratings = [], onRatingSubmitted, loading }) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isNA, setIsNA] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRating && !isNA) return;

    setSubmitting(true);
    setError(null);
    try {
      const ratingData = {
        indicator_id: indicatorId,
        rating: isNA ? null : selectedRating,
        comment,
        is_na: isNA
      };

      const newRating = await engagementService.submitRating(ratingData);
      onRatingSubmitted && onRatingSubmitted(newRating);
      
      // Reset form
      setSelectedRating(null);
      setComment('');
      setIsNA(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate rating statistics
  const ratingStats = React.useMemo(() => {
    if (ratings.length === 0) return null;

    const validRatings = ratings.filter(r => !r.is_na && r.rating);
    const naRatings = ratings.filter(r => r.is_na);
    
    if (validRatings.length === 0) {
      return { average: 0, distribution: {}, total: ratings.length, naCount: naRatings.length };
    }

    const sum = validRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / validRatings.length;
    
    const distribution = validRatings.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    return { average, distribution, total: ratings.length, naCount: naRatings.length };
  }, [ratings]);

  return (
    <div className="rating-panel">
      {/* Rating Form */}
      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">
            <i className="bi bi-star me-2"></i>
            Rate this Indicator
          </Form.Label>
          
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              id="not-applicable"
              label="Not Applicable (N/A)"
              checked={isNA}
              onChange={(e) => {
                setIsNA(e.target.checked);
                if (e.target.checked) {
                  setSelectedRating(null);
                }
              }}
              className="mb-2"
            />
          </div>

          {!isNA && (
            <div className="rating-options">
              {RATING_LEVELS.map(level => (
                <div key={level.value} className="mb-2">
                  <Form.Check
                    type="radio"
                    id={`rating-${level.value}`}
                    name="rating"
                    value={level.value}
                    label={
                      <div className="d-flex justify-content-between align-items-center w-100">
                        <div>
                          <Badge bg={level.color} className="me-2">{level.value}</Badge>
                          <strong>{level.label}</strong>
                        </div>
                        <small className="text-muted">{level.description}</small>
                      </div>
                    }
                    checked={selectedRating === level.value}
                    onChange={(e) => setSelectedRating(parseInt(e.target.value))}
                    className="rating-option"
                  />
                </div>
              ))}
            </div>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Comment (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isNA ? "Explain why this indicator is not applicable..." : "Provide additional context for your rating..."}
          />
        </Form.Group>

        {error && (
          <Alert variant="danger" className="small">{error}</Alert>
        )}

        <div className="d-flex justify-content-end">
          <Button 
            type="submit" 
            variant={isNA ? "secondary" : "primary"}
            disabled={submitting || (!selectedRating && !isNA)}
            className="px-4"
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Submitting...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Submit {isNA ? 'N/A' : 'Rating'}
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* Rating Statistics */}
      {ratingStats && ratings.length > 0 && (
        <div className="rating-stats mb-4">
          <h6 className="mb-3">
            <i className="bi bi-bar-chart me-2"></i>
            Rating Summary
          </h6>
          
          <Row className="mb-3">
            <Col md={6}>
              <div className="text-center p-3 bg-light rounded">
                <div className="fs-2 fw-bold text-primary">
                  {ratingStats.average > 0 ? ratingStats.average.toFixed(1) : 'N/A'}
                </div>
                <small className="text-muted">Average Rating</small>
              </div>
            </Col>
            <Col md={6}>
              <div className="text-center p-3 bg-light rounded">
                <div className="fs-2 fw-bold text-info">
                  {ratingStats.total}
                </div>
                <small className="text-muted">Total Responses</small>
              </div>
            </Col>
          </Row>

          {Object.keys(ratingStats.distribution).length > 0 && (
            <div className="rating-distribution">
              <small className="text-muted mb-2 d-block">Rating Distribution</small>
              {RATING_LEVELS.map(level => {
                const count = ratingStats.distribution[level.value] || 0;
                const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                
                return (
                  <div key={level.value} className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>
                        <Badge bg={level.color} className="me-2">{level.value}</Badge>
                        {level.label}
                      </span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <ProgressBar 
                      now={percentage} 
                      variant={level.color}
                      style={{ height: '8px' }}
                    />
                  </div>
                );
              })}
              
              {ratingStats.naCount > 0 && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>
                      <Badge bg="secondary" className="me-2">N/A</Badge>
                      Not Applicable
                    </span>
                    <span>{ratingStats.naCount} ({((ratingStats.naCount / ratingStats.total) * 100).toFixed(0)}%)</span>
                  </div>
                  <ProgressBar 
                    now={(ratingStats.naCount / ratingStats.total) * 100} 
                    variant="secondary"
                    style={{ height: '8px' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Individual Ratings List */}
      {ratings.length > 0 && (
        <div className="ratings-list">
          <h6 className="mb-3">
            <i className="bi bi-list-ul me-2"></i>
            Individual Ratings ({ratings.length})
          </h6>
          
          <ListGroup variant="flush">
            {ratings.map(rating => (
              <ListGroup.Item key={rating.id} className="px-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2">{rating.user?.name || 'Anonymous'}</strong>
                      {rating.is_na ? (
                        <Badge bg="secondary">N/A</Badge>
                      ) : (
                        <Badge bg={RATING_LEVELS.find(l => l.value === rating.rating)?.color || 'secondary'}>
                          {rating.rating}/5
                        </Badge>
                      )}
                      <small className="text-muted ms-2">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    {rating.comment && (
                      <p className="mb-0 text-muted small">{rating.comment}</p>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      {ratings.length === 0 && !loading && (
        <div className="text-center text-muted py-4">
          <i className="bi bi-star fs-2 mb-2 d-block"></i>
          <p>No ratings yet. Be the first to rate this indicator!</p>
        </div>
      )}
    </div>
  );
}