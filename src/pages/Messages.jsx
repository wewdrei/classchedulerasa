import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Alert, Spinner, Table, Tabs, Tab } from 'react-bootstrap';
import { messageService } from '../services/messageService';
import { apiFetch } from '../api';
import notify from '../utils/notify';

export default function Messages({ currentUser }) {
  const [inbox, setInbox] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [reading, setReading] = useState(null);
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('inbox');

  useEffect(() => {
    load();
    apiFetch('/api/users').then(async res => {
      if (res.ok) setUsers(await res.json());
    });
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setInbox(await messageService.getInbox());
      setOutbox(await messageService.getOutbox());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setForm({ recipient_id: '', subject: '', body: '' });
    setShowModal(true);
  }

  async function send() {
    setSaving(true);
    try {
      await messageService.send(form);
      setShowModal(false);
      load();
    } catch (e) {
      notify.error('Send failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    const ok = await notify.confirm({ text: 'Delete this message?' });
    if (!ok) return;
    await messageService.remove(id);
    notify.toast({ icon: 'success', title: 'Message deleted' });
    load();
  }

  async function read(id) {
    setShowRead(true);
    setReading(null);
    try {
      setReading(await messageService.get(id));
    } catch (e) {
      notify.error('Load failed', e.message);
      setShowRead(false);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Messages</h3>
        <Button onClick={openModal} variant="primary">Compose</Button>
      </div>
      <Tabs activeKey={tab} onSelect={setTab} className="mb-3">
        <Tab eventKey="inbox" title="Inbox">
          {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inbox.map(m => (
                  <tr key={m.id} style={{ fontWeight: m.read_at ? 'normal' : 'bold' }}>
                    <td>{m.sender?.name || 'N/A'}</td>
                    <td>{m.subject}</td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>{m.read_at ? 'Read' : 'Unread'}</td>
                    <td>
                      <Button size="sm" variant="info" onClick={() => read(m.id)}>Read</Button>{' '}
                      <Button size="sm" variant="danger" onClick={() => remove(m.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
        <Tab eventKey="outbox" title="Outbox">
          {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map(m => (
                  <tr key={m.id}>
                    <td>{m.recipient?.name || 'N/A'}</td>
                    <td>{m.subject}</td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>
                      <Button size="sm" variant="info" onClick={() => read(m.id)}>View</Button>{' '}
                      <Button size="sm" variant="danger" onClick={() => remove(m.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Compose Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Select value={form.recipient_id} onChange={e => setForm(f => ({ ...f, recipient_id: e.target.value }))}>
                <option value="">Select recipient...</option>
                {users.filter(u => u.id !== currentUser?.id).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Body</Form.Label>
              <Form.Control as="textarea" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={send} disabled={saving}>{saving ? 'Sending...' : 'Send'}</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showRead} onHide={() => setShowRead(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reading ? (
            <div>
              <div><b>From:</b> {reading.sender?.name || 'N/A'}</div>
              <div><b>To:</b> {reading.recipient?.name || 'N/A'}</div>
              <div><b>Subject:</b> {reading.subject}</div>
              <div><b>Date:</b> {new Date(reading.created_at).toLocaleString()}</div>
              <hr />
              <div style={{ whiteSpace: 'pre-wrap' }}>{reading.body}</div>
            </div>
          ) : <Spinner animation="border" />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRead(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
