import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { announcementService } from '../services/announcementService';
import notify from '../utils/notify';

export default function Announcements({ isAdmin }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAnnouncements(await announcementService.getAll());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(announcement = null) {
    setEditing(announcement);
    setForm(announcement ? { title: announcement.title, body: announcement.body } : { title: '', body: '' });
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await announcementService.update(editing.id, form);
      } else {
        await announcementService.create(form);
      }
      setShowModal(false);
      load();
    } catch (e) {
      notify.error('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    const ok = await notify.confirm({ text: 'Delete this announcement?' });
    if (!ok) return;
    await announcementService.remove(id);
    notify.toast({ icon: 'success', title: 'Announcement deleted' });
    load();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Announcements</h3>
        {isAdmin && <Button onClick={() => openModal()} variant="primary">New Announcement</Button>}
      </div>
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <Table bordered hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Body</th>
              <th>Author</th>
              <th>Published</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {announcements.map(a => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.body}</td>
                <td>{a.user?.name || 'N/A'}</td>
                <td>{a.published_at ? new Date(a.published_at).toLocaleString() : ''}</td>
                {isAdmin && <td>
                  <Button size="sm" variant="secondary" onClick={() => openModal(a)}>Edit</Button>{' '}
                  <Button size="sm" variant="danger" onClick={() => remove(a.id)}>Delete</Button>
                </td>}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit' : 'New'} Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Body</Form.Label>
              <Form.Control as="textarea" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
