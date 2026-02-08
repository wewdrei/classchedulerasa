import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';
import EngagementPanel from '../components/EngagementPanel';
import EngagementSummary from '../components/EngagementSummary';
import { programService } from '../services/programService';

export default function Engagement() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await programService.getPrograms();
      setPrograms(data);
      // Auto-select first program if only one exists
      if (data.length === 1) {
        setSelectedProgram(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <span className="spinner-border me-2" />
          Loading programs...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-people me-2"></i>
                Engagement Center
              </h2>
              <p className="text-muted mb-0">
                Collaborate on program indicators with comments, ratings, and feedback
              </p>
            </div>
            {programs.length > 1 && (
              <Card style={{ minWidth: '300px' }}>
                <Card.Body className="py-2">
                  <Form.Group className="mb-0">
                    <Form.Label className="small text-muted mb-1">Select Program</Form.Label>
                    <Form.Select
                      size="sm"
                      value={selectedProgram?.id || ''}
                      onChange={(e) => {
                        const programId = parseInt(e.target.value);
                        const program = programs.find(p => p.id === programId);
                        setSelectedProgram(program || null);
                      }}
                    >
                      <option value="">Choose a program...</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>
                          {program.code ? `${program.code} • ${program.name}` : program.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* No Programs State */}
          {programs.length === 0 && (
            <Alert variant="info" className="text-center py-5">
              <i className="bi bi-folder2-open fs-1 mb-3 d-block"></i>
              <h5>No Programs Available</h5>
              <p className="mb-3">
                No programs have been set up for engagement yet.
              </p>
              <Button variant="primary" onClick={loadPrograms}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </Alert>
          )}

          {/* Program Selection State */}
          {programs.length > 0 && !selectedProgram && (
            <Alert variant="light" className="text-center py-5">
              <i className="bi bi-cursor fs-1 mb-3 d-block text-primary"></i>
              <h5>Select a Program</h5>
              <p className="mb-0 text-muted">
                Choose a program from the dropdown above to start engaging with indicators
              </p>
            </Alert>
          )}

          {/* Engagement Interface */}
          {selectedProgram && (
            <div>
               <div className="mb-4">
                 <EngagementSummary programId={selectedProgram.id} />
               </div>
             
              <Card className="mb-3">
                <Card.Body className="py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">{selectedProgram.code || selectedProgram.name}</h6>
                      {selectedProgram.code && selectedProgram.name && selectedProgram.code !== selectedProgram.name && (
                        <div className="text-muted small">{selectedProgram.name}</div>
                      )}
                      <small className="text-muted">
                        Program ID: {selectedProgram.id}
                        {selectedProgram.level && ` • Level: ${selectedProgram.level.name}`}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={loadPrograms}
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <EngagementPanel programId={selectedProgram.id} />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}