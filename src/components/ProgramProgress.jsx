import { useEffect, useState } from 'react';
import { Card, ProgressBar, Badge, Alert, Spinner } from 'react-bootstrap';
import { fetchProgramProgress } from '../services/progressService';

// Optional props:
// onSelectArea(area) -> invoked when user clicks an area progress bar
// selectedArea -> currently selected area for highlighting
// compact -> if true, renders smaller header
export default function ProgramProgress({ programId, onSelectArea, selectedArea, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programId) {
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    fetchProgramProgress(programId)
      .then(setData)
      .catch(e => setError(e.message || 'Error loading progress'))
      .finally(() => setLoading(false));
  }, [programId]);

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            {compact ? 'Progress' : 'Program Progress'}
          </h6>
        </Card.Header>
        <Card.Body className="text-center py-3">
          <Spinner size="sm" className="me-2" />
          Loading progress...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            {compact ? 'Progress' : 'Program Progress'}
          </h6>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" className="small mb-0">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!data) return null;

  const clickable = typeof onSelectArea === 'function';

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            {compact ? 'Progress' : 'Program Progress'}
          </h6>
          <Badge bg="primary">{data.overall_percent}%</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {!compact && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted">Overall Completion</span>
              <span className="fw-bold">{data.overall_percent}%</span>
            </div>
            <ProgressBar 
              now={data.overall_percent} 
              variant="primary"
              style={{ height: '10px' }}
            />
          </div>
        )}

        <div className="areas-list">
          <div className="small text-uppercase text-muted fw-bold mb-2">Areas</div>
          {data.areas.map(area => {
            const isSelected = selectedArea?.area_id === area.area_id;
            
            return (
              <div 
                key={area.area_id} 
                className={`mb-3 ${clickable ? 'area-item-clickable' : ''} ${isSelected ? 'area-selected' : ''}`}
                style={{
                  cursor: clickable ? 'pointer' : 'default',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'var(--bs-primary-bg-subtle)' : 'transparent',
                  border: isSelected ? '1px solid var(--bs-primary-border-subtle)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => clickable && onSelectArea(area)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={`small ${clickable ? 'text-primary' : ''} ${isSelected ? 'fw-bold' : ''}`}>
                    <i className="bi bi-bullseye me-1"></i>
                    Area {area.area_id}
                    {area.name && ` - ${area.name}`}
                  </span>
                  <span className={`small ${isSelected ? 'fw-bold' : ''}`}>
                    {area.percent}%
                  </span>
                </div>
                <ProgressBar 
                  now={area.percent} 
                  variant={isSelected ? 'primary' : 'info'}
                  style={{ height: '6px' }}
                />
                {area.indicators_count && (
                  <small className="text-muted mt-1 d-block">
                    {area.completed_indicators || 0} of {area.indicators_count} indicators completed
                  </small>
                )}
              </div>
            );
          })}
        </div>

        {data.milestones && data.milestones.length > 0 && (
          <div className="mt-3">
            <div className="small text-uppercase text-muted fw-bold mb-2">
              <i className="bi bi-flag me-1"></i>
              Recent Milestones
            </div>
            <ul className="small ps-3 mb-0">
              {data.milestones.slice(0, 3).map((milestone, index) => (
                <li key={index} className="mb-1">{milestone}</li>
              ))}
            </ul>
          </div>
        )}

        {clickable && (
          <div className="mt-3 pt-2 border-top">
            <small className="text-muted">
              <i className="bi bi-cursor me-1"></i>
              Click on an area to view its indicators
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
