import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import ProgramProgress from './ProgramProgress';
import IndicatorSelector from './IndicatorSelector';
import CommentThread from './CommentThread';
import RatingPanel from './RatingPanel';
import { engagementService } from '../services/engagementService';
import './Engagement.css';

export default function EngagementPanel({ programId }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [activeTab, setActiveTab] = useState('comments');
  const [engagementData, setEngagementData] = useState({
    comments: [],
    ratings: [],
    progress: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load engagement data when indicator changes
  useEffect(() => {
    if (selectedIndicator) {
      loadEngagementData();
    } else {
      setEngagementData({ comments: [], ratings: [], progress: null });
    }
  }, [selectedIndicator]);

  const loadEngagementData = async () => {
    if (!selectedIndicator) return;

    setLoading(true);
    setError(null);
    try {
      const [comments, ratings] = await Promise.all([
        engagementService.getComments(selectedIndicator.id, 'indicator'),
        engagementService.getRatings(selectedIndicator.id)
      ]);
      
      setEngagementData({
        comments,
        ratings,
        progress: null // Will be loaded separately if needed
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen for SSE comment notifications to live-refresh when viewing the matching indicator
  useEffect(() => {
    const onNotify = (ev) => {
      try {
        const n = JSON.parse(ev.data || '{}');
        if (n?.type === 'comment' && selectedIndicator) {
          // If link points to this indicator, refresh comments
          const match = (n.link || '').match(/\/indicators\/(\d+)/);
          const id = match ? parseInt(match[1]) : null;
          if (id && id === selectedIndicator.id) {
            loadEngagementData();
          }
        }
      } catch {}
    };
    try { if (window.__appEventSource) window.__appEventSource.addEventListener('notification', onNotify); } catch {}
    return () => { try { if (window.__appEventSource) window.__appEventSource.removeEventListener('notification', onNotify); } catch {} };
  }, [selectedIndicator]);

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    setSelectedIndicator(null); // Reset indicator when area changes
  };

  const handleIndicatorSelect = (indicator) => {
    setSelectedIndicator(indicator);
  };

  const handleCommentAdded = (newComment) => {
    setEngagementData(prev => ({
      ...prev,
      comments: [newComment, ...prev.comments]
    }));
  };

  const handleRatingSubmitted = (newRating) => {
    setEngagementData(prev => ({
      ...prev,
      ratings: [newRating, ...prev.ratings.filter(r => r.user_id !== newRating.user_id)]
    }));
  };

  if (!programId) {
    return (
      <Alert variant="info" className="text-center">
        <i className="bi bi-info-circle fs-4 mb-2 d-block"></i>
        Please select a program to begin engagement
      </Alert>
    );
  }

  return (
    <div className="engagement-panel">
      <Row>
        {/* Left Column: Progress and Indicators */}
        <Col md={4}>
          <div className="mb-3">
            <ProgramProgress 
              programId={programId} 
              onAreaSelect={handleAreaSelect}
              selectedArea={selectedArea}
            />
          </div>
          <IndicatorSelector 
            programId={programId}
            selectedArea={selectedArea}
            onSelectIndicator={handleIndicatorSelect}
            selectedIndicator={selectedIndicator}
          />
        </Col>

        {/* Right Column: Engagement Interface */}
        <Col md={8}>
          {!selectedIndicator ? (
            <Card>
              <Card.Body className="text-center py-5">
                <i className="bi bi-chat-square-dots fs-1 text-muted mb-3 d-block"></i>
                <h5 className="text-muted mb-2">No Indicator Selected</h5>
                <p className="text-muted">
                  Select an indicator from the list to view comments, ratings, and engagement options.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">{selectedIndicator.label}</h6>
                    <small className="text-muted">
                      Area {selectedArea?.area_id} • {selectedIndicator.parameter?.name}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Badge bg="primary">
                      <i className="bi bi-chat-fill me-1"></i>
                      {engagementData.comments.length}
                    </Badge>
                    <Badge bg="warning">
                      <i className="bi bi-star-fill me-1"></i>
                      {engagementData.ratings.length}
                    </Badge>
                  </div>
                </div>
              </Card.Header>

              {error && (
                <Alert variant="danger" className="mb-0 border-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Card.Header className="pb-0 pt-3">
                  <Nav variant="tabs" className="border-0">
                    <Nav.Item>
                      <Nav.Link eventKey="comments" className="py-2">
                        <i className="bi bi-chat-dots me-2"></i>
                        Comments
                        {engagementData.comments.length > 0 && (
                          <Badge bg="primary" className="ms-2">
                            {engagementData.comments.length}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="ratings" className="py-2">
                        <i className="bi bi-star me-2"></i>
                        Ratings
                        {engagementData.ratings.length > 0 && (
                          <Badge bg="warning" className="ms-2">
                            {engagementData.ratings.length}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>

                <Card.Body style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
                  <Tab.Content>
                    <Tab.Pane eventKey="comments">
                      <CommentThread
                        entityType="indicator"
                        entityId={selectedIndicator.id}
                        comments={engagementData.comments}
                        onCommentAdded={handleCommentAdded}
                        loading={loading}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="ratings">
                      <RatingPanel
                        indicatorId={selectedIndicator.id}
                        ratings={engagementData.ratings}
                        onRatingSubmitted={handleRatingSubmitted}
                        loading={loading}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Tab.Container>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}