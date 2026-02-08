import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { apiFetch } from '../api';

export default function AIStatusCard() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/ai/status');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setStatus(json);
    } catch (err) {
      setError(err.message || 'Failed to fetch AI status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Card.Title style={{ marginBottom: '0.25rem' }}>AI Provider</Card.Title>
            <Card.Subtitle className="text-muted" style={{ fontSize: '0.85rem' }}>Gemini (Google Generative)</Card.Subtitle>
          </div>
          <div>
            {loading ? <Spinner animation="border" size="sm" /> : (
              status?.configured ? <Badge bg="success">Configured</Badge> : <Badge bg="danger">Not Configured</Badge>
            )}
          </div>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          {loading && <div style={{ fontSize: '0.9rem' }}>Checking...</div>}
          {error && <div className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</div>}
          {status && !error && (
            <div style={{ fontSize: '0.9rem' }}>
              <div>Configured model: <strong>{status.configured_model || '—'}</strong></div>
              <div>Discovered/cached model: <strong>{status.cached_model || '—'}</strong></div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end mt-3">
          <Button size="sm" variant="primary" onClick={fetchStatus} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
      </Card.Body>
    </Card>
  );
}
