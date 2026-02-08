import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { engagementService } from '../services/engagementService';

export default function EngagementSummary({ programId }) {
  const [summary, setSummary] = useState({
    totalIndicators: 0,
    ratedIndicators: 0,
    commentedIndicators: 0,
    averageRating: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (programId) {
      loadSummary();
    }
  }, [programId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would require additional backend endpoints for summary data
      // For now, we'll simulate the data structure
      const mockSummary = {
        totalIndicators: 45,
        ratedIndicators: 32,
        commentedIndicators: 28,
        averageRating: 3.7,
        recentActivity: [
          { type: 'rating', indicator: 'Quality Assurance Process', user: 'Dr. Smith', value: 4, timestamp: '2 hours ago' },
          { type: 'comment', indicator: 'Faculty Qualifications', user: 'Prof. Johnson', timestamp: '4 hours ago' },
          { type: 'rating', indicator: 'Learning Resources', user: 'Ms. Davis', value: 5, timestamp: '1 day ago' }
        ]
      };

      setSummary(mockSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner size="sm" className="me-2" />
          Loading engagement summary...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">{error}</Alert>
    );
  }

  const ratingProgress = summary.totalIndicators > 0 ? (summary.ratedIndicators / summary.totalIndicators) * 100 : 0;
  const commentProgress = summary.totalIndicators > 0 ? (summary.commentedIndicators / summary.totalIndicators) * 100 : 0;

  return (
    <div className="engagement-summary">
      <Row>
        {/* Key Metrics */}
        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="engagement-metric bg-primary text-white">
                <div className="metric-value">{summary.totalIndicators}</div>
                <div className="metric-label">Total Indicators</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="engagement-metric bg-success text-white">
                <div className="metric-value">{summary.ratedIndicators}</div>
                <div className="metric-label">Rated Indicators</div>
              </div>
              <div className="mt-2">
                <ProgressBar now={ratingProgress} variant="success" className="mb-1" style={{ height: '6px' }} />
                <small className="text-muted">{ratingProgress.toFixed(0)}% complete</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="engagement-metric bg-info text-white">
                <div className="metric-value">{summary.commentedIndicators}</div>
                <div className="metric-label">With Comments</div>
              </div>
              <div className="mt-2">
                <ProgressBar now={commentProgress} variant="info" className="mb-1" style={{ height: '6px' }} />
                <small className="text-muted">{commentProgress.toFixed(0)}% commented</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="engagement-metric bg-warning text-white">
                <div className="metric-value">{summary.averageRating.toFixed(1)}</div>
                <div className="metric-label">Average Rating</div>
              </div>
              <div className="mt-2">
                <div className="d-flex justify-content-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <i 
                      key={star}
                      className={`bi bi-star${summary.averageRating >= star ? '-fill' : ''} text-warning me-1`}
                    />
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card>
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Recent Activity
          </h6>
        </Card.Header>
        <Card.Body>
          {summary.recentActivity.length === 0 ? (
            <div className="text-center text-muted py-3">
              <i className="bi bi-activity fs-4 mb-2 d-block"></i>
              No recent activity
            </div>
          ) : (
            <div className="activity-list">
              {summary.recentActivity.map((activity, index) => (
                <div key={index} className="d-flex align-items-center mb-3">
                  <div className="flex-shrink-0 me-3">
                    {activity.type === 'rating' ? (
                      <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <i className="bi bi-star-fill small"></i>
                      </div>
                    ) : (
                      <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <i className="bi bi-chat-fill small"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold small">{activity.user}</div>
                        <div className="text-muted small">
                          {activity.type === 'rating' ? 'Rated' : 'Commented on'} "{activity.indicator}"
                          {activity.type === 'rating' && (
                            <Badge bg="warning" className="ms-2">{activity.value}/5</Badge>
                          )}
                        </div>
                      </div>
                      <small className="text-muted">{activity.timestamp}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}