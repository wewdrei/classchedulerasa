import React, { useState, useEffect } from 'react';
import { Card, Form, ListGroup, Spinner, Badge, Alert } from 'react-bootstrap';
import { engagementService } from '../services/engagementService';

export default function IndicatorSelector({ programId, selectedArea, onSelectIndicator, selectedIndicator }) {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadIndicators = async () => {
    if (!selectedArea) {
      setIndicators([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await engagementService.getIndicatorsByArea(selectedArea.area_id);
      setIndicators(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndicators();
  }, [selectedArea]);

  const filteredIndicators = indicators.filter(indicator =>
    indicator.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedArea) {
    return (
      <Card>
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-bullseye me-2"></i>
            Indicators
          </h6>
        </Card.Header>
        <Card.Body className="text-muted text-center py-4">
          <i className="bi bi-arrow-left-circle fs-1 mb-2 d-block"></i>
          Select an area from progress to view indicators
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="indicator-selector">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-bullseye me-2"></i>
            Indicators
          </h6>
          <Badge bg="secondary">{filteredIndicators.length}</Badge>
        </div>
        {selectedArea && (
          <small className="text-muted">Area {selectedArea.area_id}</small>
        )}
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {indicators.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
            />
          </Form.Group>
        )}

        {loading && (
          <div className="text-center py-3">
            <Spinner size="sm" className="me-2" />
            Loading indicators...
          </div>
        )}

        {error && (
          <Alert variant="danger" className="small">{error}</Alert>
        )}

        {!loading && filteredIndicators.length === 0 && !error && (
          <div className="text-center text-muted py-3">
            <i className="bi bi-search fs-4 mb-2 d-block"></i>
            {searchTerm ? 'No indicators match your search' : 'No indicators found for this area'}
          </div>
        )}

        {!loading && filteredIndicators.length > 0 && (
          <ListGroup variant="flush">
            {filteredIndicators.map(indicator => (
              <ListGroup.Item
                key={indicator.id}
                action
                active={selectedIndicator?.id === indicator.id}
                onClick={() => onSelectIndicator && onSelectIndicator(indicator)}
                className="py-2 px-0"
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-bold small">{indicator.label}</div>
                    {indicator.description && (
                      <div className="text-muted small mt-1" style={{ fontSize: '0.8rem' }}>
                        {indicator.description.length > 100 
                          ? `${indicator.description.substring(0, 100)}...` 
                          : indicator.description}
                      </div>
                    )}
                  </div>
                  <div className="ms-2">
                    <Badge 
                      bg={selectedIndicator?.id === indicator.id ? 'light' : 'primary'} 
                      className="small"
                    >
                      {indicator.parameter?.name || 'Param'}
                    </Badge>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
      {selectedIndicator && (
        <Card.Footer className="small text-muted">
          Selected: {selectedIndicator.label}
        </Card.Footer>
      )}
    </Card>
  );
}