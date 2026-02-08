import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Nav, Dropdown, Table, Modal, Card, ListGroup, Badge, ProgressBar, Image } from 'react-bootstrap';
import CommentThread from './components/CommentThread';
import { engagementService } from './services/engagementService';
import PasswordInput from './components/PasswordInput';
import { apiFetch } from './api';
// Pusher/Echo removed — using SSE exclusively for realtime updates
import notify from './utils/notify';

// --- Asset URLs ---
const logoUrl = '/LOGO (1).png';
const backgroundImageUrl = '/bg.jpg';
const AI_CACHE_STORAGE_KEY = 'ams-ai-analysis-cache-v1';

const readAiCache = () => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(AI_CACHE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        console.warn('Unable to read AI analysis cache:', err);
        return {};
    }
};

const writeAiCache = (cache) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(AI_CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch (err) {
        console.warn('Unable to persist AI analysis cache:', err);
    }
};

const upsertAiCacheEntry = (programId, entry) => {
    const cache = readAiCache();
    cache[programId] = { ...entry, updatedAt: Date.now() };
    writeAiCache(cache);
};

const removeAiCacheEntry = (programId) => {
    const cache = readAiCache();
    if (cache[programId]) {
        delete cache[programId];
        writeAiCache(cache);
    }
};

const computeProgramSignature = (item) => {
    if (!item) return null;
    return [
            // AnnouncementsPage removed — broadcast moved into User Management
        item.total_criteria ?? 'na',
        item.compliance_percentage ?? 'na',
        item.predicted_status ?? 'na',
    ].join('|');
};

const buildStorageUrl = (path) => {
    if (!path) return null;
    const p = String(path);
    // If already an absolute URL, return as-is
    if (/^https?:\/\//i.test(p)) return p;
    const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
    // Normalize any leading slashes
    const normalized = p.replace(/^\/+/, '');
    return `${base}/storage/${normalized}`;
};

const hasRole = (user, roles=[]) => {
    const name = user?.role?.name?.toLowerCase?.() || '';
    return roles.some(r => r.toLowerCase() === name);
};

const DOCUMENT_STATUS_MAP = {
    approved: { label: 'Compliant', variant: 'success' },
    compliant: { label: 'Compliant', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    pending_review: { label: 'Pending', variant: 'warning' },
    revision_requested: { label: 'Needs Revision', variant: 'danger' },
    rejected: { label: 'Rejected', variant: 'danger' },
    draft: { label: 'Draft', variant: 'secondary' },
    missing: { label: 'Missing', variant: 'danger' },
};

const getDocumentStatusMeta = (status) => {
    if (!status) {
        return { label: 'Pending', variant: 'warning' };
    }
    const key = String(status).toLowerCase();
    if (DOCUMENT_STATUS_MAP[key]) {
        return DOCUMENT_STATUS_MAP[key];
    }
    const readable = key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    return { label: readable, variant: 'secondary' };
};

// --- Loading Components ---
function FullScreenLoader() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#1e3a8a',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999,
        }}>
            <img src={logoUrl} alt="Loading..." style={{ width: '150px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
    );
}

function ContentLoader() {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            borderRadius: '0.75rem'
        }}>
            <Spinner animation="border" role="status" style={{ color: 'var(--primary-purple)' }}>
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    );
}


// --- Document Viewer Modal ---
function DocumentViewerModal({ show, onHide, title, src, originalPath }) {
    const [downloadUrl, setDownloadUrl] = useState('');

    const resolveExt = () => {
        const candidates = [originalPath, title, src].filter(Boolean).map(String);
        for (const c of candidates) {
            const base = c.split('?')[0].toLowerCase();
            const m = base.match(/\.([a-z0-9]+)$/i);
            if (m) return m[1];
        }
        return '';
    };

    const makeViewerSrc = (url) => {
        if (!url) return '';
        const ext = resolveExt();
        const encoded = encodeURIComponent(url);
        if (ext === 'pdf') {
            // Directly embed PDFs
            return url;
        }
        if (/(doc|docx|pptx?|xlsx?)/i.test(ext)) {
            // Use Office Online viewer for Office docs
            return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
        }
        // Fallback to Google viewer for other types
        return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
    };

    const viewerSrc = makeViewerSrc(src);

    useEffect(() => {
        setDownloadUrl('');
        // If we have an originalPath that likely belongs to a known document id (encoded in src via our API route),
        // attempt to ask the API for a signed download URL. Otherwise, just use the raw src.
        const tryFetch = async () => {
            try {
                // Heuristic: if the src contains "/documents/" with an id, we are already using a signed route.
                // In that case, simply append download=1 if not present.
                if (src && /\/documents\/(\d+)\//.test(src)) {
                    const hasQuery = src.includes('?');
                    setDownloadUrl(src + (hasQuery ? '&' : '?') + 'download=1');
                    return;
                }
                // Otherwise we cannot infer an id; fall back to src
                setDownloadUrl(src || '');
            } catch {
                setDownloadUrl(src || '');
            }
        };
        if (src) tryFetch();
    }, [src, originalPath]);

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="document-viewer-modal">
            <Modal.Header closeButton>
                <Modal.Title>{title || 'Preview'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!src ? (
                    <Alert variant="warning" className="mb-0">No preview available for this file.</Alert>
                ) : (
                    <div style={{ height: '75vh' }} className="border rounded overflow-hidden position-relative">
                        <iframe
                            title={title || 'Document Preview'}
                            src={viewerSrc}
                            style={{ width: '100%', height: '100%', border: '0' }}
                            referrerPolicy="no-referrer"
                            allowFullScreen
                        />
                    </div>
                )}
                {src && (
                    <div className="mt-2 d-flex gap-2">
                        <Button as="a" href={src} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" title="Open original file in a new tab">
                            Open Original
                        </Button>
                        <Button as="a" href={downloadUrl || src} target="_blank" rel="noopener noreferrer" variant="primary" size="sm" title="Download this file">
                            Download
                        </Button>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

function MyReviewsPage({ onOpenSection }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        const load = async () => {
            setLoading(true); setError('');
            try {
                const res = await apiFetch('/api/reviewer-assignments/mine');
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to load assignments');
                setItems(Array.isArray(data) ? data : []);
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        };
        load();
    }, []);
    return (
        <div className="content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="mb-0">My Reviews</h1>
            </div>
            {loading ? <div className="text-center p-5"><Spinner animation="border"/></div> : error ? <Alert variant="danger">{error}</Alert> : (
                items.length === 0 ? <div className="text-muted">No review assignments yet.</div> : (
                    <Table striped responsive>
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>SAR</th>
                                <th>Section</th>
                                <th>Role</th>
                                <th>Due</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(it => (
                                <tr key={it.id}>
                                    <td>{it.program?.code || it.program?.name || '—'}</td>
                                    <td>#{it.sar_id}</td>
                                    <td>{it.section_no ? `Section ${it.section_no}` : '—'}</td>
                                    <td>{it.role || 'Reviewer'}</td>
                                    <td>{it.due_date || '—'}</td>
                                    <td className="text-end">
                                        <Button size="sm" onClick={() => onOpenSection(it.sar_id, it.section_no || null)}>
                                            Open
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )
            )}
        </div>
    );
}


function DocumentRepositoryPage({ onSelectProgram }) {
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const filteredPrograms = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return programs;
        return programs.filter((program) => {
            const code = (program.code || '').toLowerCase();
            const name = (program.name || '').toLowerCase();
            const level = (program.accreditation_level || '').toLowerCase();
            const status = (program.status || '').toLowerCase();
            return code.includes(query) || name.includes(query) || level.includes(query) || status.includes(query);
        });
    }, [programs, searchTerm]);

    useEffect(() => {
        const loadPrograms = async () => {
            try {
                const response = await apiFetch('/api/programs');
                if (!response.ok) throw new Error('Failed to load programs.');
                setPrograms(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadPrograms();
    }, []);

    return (
        <div className="content-card">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h1 className="mb-1">Document Repository</h1>
                    <p className="text-muted mb-0">Select a program to manage submissions across all accreditation sections.</p>
                </div>
                <Form.Control
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search programs..."
                    style={{ maxWidth: '260px' }}
                />
            </div>
            {isLoading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : programs.length === 0 ? (
                <div className="text-center py-5 text-muted">No programs available yet.</div>
            ) : filteredPrograms.length === 0 ? (
                <div className="text-center py-5 text-muted">No programs match your search.</div>
            ) : (
                <Row className="g-4">
                    {filteredPrograms.map(program => (
                        <Col md={6} key={program.id}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="mb-1">{program.code || program.name}</h5>
                                            {program.code && program.name && program.code !== program.name && (
                                                <div className="text-muted small mb-1">{program.name}</div>
                                            )}
                                            <small className="text-muted">Accreditation Level: {program.accreditation_level || 'N/A'}</small>
                                        </div>
                                        <Badge
                                            bg={(program.status || '').toLowerCase() === 'inactive' ? 'danger' : 'primary'}
                                            pill
                                        >
                                            {program.status || 'Unknown'}
                                        </Badge>
                                    </div>
                                    <Button variant="primary" onClick={() => onSelectProgram(program)} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                                        <i className="bi bi-folder-symlink me-2"></i>
                                        Manage Documents
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}

function CoordinatorDashboardPage({ canReview, currentUser }) {
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [documents, setDocuments] = useState([]);
    const [subSectionsBySection, setSubSectionsBySection] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadModal, setUploadModal] = useState({ show: false, section: null });
    const [selectedSubSection, setSelectedSubSection] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [reviewingDocumentId, setReviewingDocumentId] = useState(null);
    const [preview, setPreview] = useState({ show: false, title: '', url: '' });
    const [sectionCommentMap, setSectionCommentMap] = useState({});
    const [commentModal, setCommentModal] = useState({ show: false, section: null });
    const [sectionComments, setSectionComments] = useState([]);
    const [isLoadingSectionComments, setIsLoadingSectionComments] = useState(false);
    const fileInputRef = useRef(null);
    const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

    const currentProgram = programs.find((p) => String(p.id) === String(selectedProgramId));
    const sectionNumbers = useMemo(() => Array.from({ length: 9 }, (_, index) => index + 1), []);

    // Assigned action plans for the current coordinator
    const [assignedActionPlans, setAssignedActionPlans] = useState([]);
    const [assignedLoading, setAssignedLoading] = useState(false);
    const [assignedAllActionPlans, setAssignedAllActionPlans] = useState([]); // across all programs
    const [assignedAllLoading, setAssignedAllLoading] = useState(false);

    const fetchCoordinatorSectionComments = useCallback(async (programId) => {
        if (!programId || !currentUserId) {
            setSectionCommentMap({});
            return;
        }
        try {
            const response = await apiFetch(`/api/programs/${programId}/section-comments`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to fetch section comments.');
            }
            const filtered = Array.isArray(data)
                ? data.filter((comment) => Number(comment.coordinator_id) === currentUserId)
                : [];
            const grouped = filtered.reduce((acc, comment) => {
                const sectionKey = Number(comment.section);
                if (!sectionKey) return acc;
                acc[sectionKey] = acc[sectionKey] || [];
                acc[sectionKey].push(comment);
                return acc;
            }, {});
            Object.values(grouped).forEach((list) => list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setSectionCommentMap(grouped);
        } catch (err) {
            console.error('Failed to load coordinator section comments', err);
            setSectionCommentMap({});
        }
    }, [currentUserId]);

    const loadSectionComments = useCallback(async (sectionNumber, programId) => {
        const targetProgramId = programId || selectedProgramId;
        if (!targetProgramId || !currentUserId || !sectionNumber) {
            setSectionComments([]);
            return;
        }
        setIsLoadingSectionComments(true);
        try {
            const response = await apiFetch(`/api/programs/${targetProgramId}/section-comments?section=${sectionNumber}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to load section comments.');
            }
            const normalized = Array.isArray(data)
                ? data.filter((comment) => Number(comment.coordinator_id) === currentUserId)
                : [];
            normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setSectionComments(normalized);
        } catch (err) {
            console.error('Failed to load coordinator section comments list', err);
            setSectionComments([]);
        } finally {
            setIsLoadingSectionComments(false);
        }
    }, [currentUserId, selectedProgramId]);

    useEffect(() => {
        const loadPrograms = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await apiFetch('/api/programs');
                const data = await response.json();
                if (!response.ok) throw new Error(data?.message || 'Failed to load programs.');
                setPrograms(Array.isArray(data) ? data : []);
                if (!selectedProgramId && data.length > 0) {
                    setSelectedProgramId(String(data[0].id));
                }
                if (data.length === 0) {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Failed to load programs for coordinator dashboard', err);
                setError(err.message || 'Failed to load programs.');
                setIsLoading(false);
            }
        };
        loadPrograms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(() => {
        if (!selectedProgramId) {
            setSectionCommentMap({});
            return;
        }
        // load assigned action plans for the selected program when program changes
        const fetchAssignedForSelected = async () => {
            if (!currentUserId) {
                setAssignedActionPlans([]);
                return;
            }
            try {
                const res = await apiFetch(`/api/programs/${selectedProgramId}/action-plans`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to fetch action plans.');
                const filtered = Array.isArray(data)
                    ? data.filter((ap) => Number(ap.assigned_to_user_id) === Number(currentUserId) || (ap.assigned_user && Number(ap.assigned_user.id) === Number(currentUserId)))
                    : [];
                setAssignedActionPlans(filtered);
            } catch (err) {
                console.error('Failed to load assigned action plans for selected program', err);
                setAssignedActionPlans([]);
            }
        };
        fetchAssignedForSelected();
        const loadProgramData = async () => {
            setIsLoading(true);
            setError('');
            try {
                await Promise.all([
                    fetchDocuments(selectedProgramId),
                    fetchSubSections(selectedProgramId),
                    fetchCoordinatorSectionComments(selectedProgramId),
                ]);
            } catch (err) {
                setError(err.message || 'Failed to load coordinator data.');
                setDocuments([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadProgramData();
    }, [selectedProgramId, fetchCoordinatorSectionComments]);

    // Fetch assigned action plans across all programs (run when programs list or user is available)
    useEffect(() => {
        const fetchAssignedAcrossPrograms = async () => {
            if (!currentUserId || !programs || programs.length === 0) {
                setAssignedAllActionPlans([]);
                return;
            }
            setAssignedAllLoading(true);
            try {
                const promises = programs.map(async (p) => {
                    try {
                        const res = await apiFetch(`/api/programs/${p.id}/action-plans`);
                        if (!res.ok) return [];
                        const data = await res.json();
                        if (!Array.isArray(data)) return [];
                        return data
                            .filter((ap) => Number(ap.assigned_to_user_id) === Number(currentUserId) || (ap.assigned_user && Number(ap.assigned_user.id) === Number(currentUserId)))
                            .map((ap) => ({ ...ap, _program: { id: p.id, name: p.name, code: p.code } }));
                    } catch (e) {
                        return [];
                    }
                });
                const results = await Promise.all(promises);
                const flattened = results.flat();
                // sort by due date then title
                flattened.sort((a, b) => {
                    const da = a.due_date ? new Date(a.due_date).getTime() : 0;
                    const db = b.due_date ? new Date(b.due_date).getTime() : 0;
                    if (da !== db) return da - db;
                    return String(a.title || '').localeCompare(String(b.title || ''));
                });
                setAssignedAllActionPlans(flattened);
            } catch (err) {
                console.error('Failed to fetch assigned action plans across programs', err);
                setAssignedAllActionPlans([]);
            } finally {
                setAssignedAllLoading(false);
            }
        };

        fetchAssignedAcrossPrograms();
    }, [programs, currentUserId]);

    // Live refresh for coordinator view on document/comment changes
    useEffect(() => {
        const onRefresh = () => {
            if (!selectedProgramId) return;
            fetchDocuments(selectedProgramId);
            fetchCoordinatorSectionComments(selectedProgramId);
            if (commentModal.show && commentModal.section) {
                loadSectionComments(commentModal.section, selectedProgramId);
            }
        };
        window.addEventListener('documents:changed', onRefresh);
        window.addEventListener('dashboard:refresh', onRefresh);
        return () => {
            window.removeEventListener('documents:changed', onRefresh);
            window.removeEventListener('dashboard:refresh', onRefresh);
        };
    }, [selectedProgramId, fetchCoordinatorSectionComments, commentModal.show, commentModal.section, loadSectionComments]);

    useEffect(() => {
        if (!uploadModal.show || !uploadModal.section) return;
        const options = subSectionsBySection[String(uploadModal.section)] || [];
        if (options.length === 0) {
            setSelectedSubSection('');
            return;
        }
        if (!options.find((opt) => opt.id === selectedSubSection)) {
            setSelectedSubSection(options[0].id);
        }
    }, [uploadModal, subSectionsBySection, selectedSubSection]);

    const statusSummary = useMemo(() => {
        let approved = 0;
        let pending = 0;
        let flagged = 0;
        let lastUpdated = null;

        documents.forEach((doc) => {
            const status = String(doc.status || '').toLowerCase();
            if (['approved', 'compliant'].includes(status)) {
                approved += 1;
            } else if (['revision_requested', 'rejected'].includes(status)) {
                flagged += 1;
            } else {
                pending += 1;
            }

            const timestamp = doc.updated_at || doc.created_at;
            if (timestamp && (!lastUpdated || new Date(timestamp).getTime() > new Date(lastUpdated).getTime())) {
                lastUpdated = timestamp;
            }
        });

        return {
            total: documents.length,
            approved,
            pending,
            flagged,
            lastUpdated,
        };
    }, [documents]);

    const commentSummary = useMemo(() => {
        return Object.entries(sectionCommentMap)
            .map(([section, notes]) => {
                if (!Array.isArray(notes) || notes.length === 0) return null;
                const latest = notes[0];
                return {
                    section: Number(section),
                    count: notes.length,
                    latest,
                };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at));
    }, [sectionCommentMap]);

    const totalCommentCount = useMemo(() => commentSummary.reduce((sum, entry) => sum + entry.count, 0), [commentSummary]);

    const totalRequiredItems = useMemo(() => {
        return sectionNumbers.reduce((count, number) => count + ((subSectionsBySection[String(number)] || []).length), 0);
    }, [sectionNumbers, subSectionsBySection]);

    const sectionInsights = useMemo(() => {
        return sectionNumbers.map((sectionNumber) => {
            const sectionKey = String(sectionNumber);
            const requiredDocs = subSectionsBySection[sectionKey] || [];
            const uploadedDocs = documents.filter((doc) => String(doc.section) === sectionKey);
            const normalizedStatuses = uploadedDocs.map((doc) => String(doc.status || '').toLowerCase());
            const flaggedCount = normalizedStatuses.filter((status) => ['revision_requested', 'rejected'].includes(status)).length;
            const approvedCount = normalizedStatuses.filter((status) => ['approved', 'compliant'].includes(status)).length;
            const pendingCount = normalizedStatuses.filter((status) => !['approved', 'compliant', 'revision_requested', 'rejected'].includes(status)).length;
            const hasRevision = normalizedStatuses.includes('revision_requested');
            const hasRejection = normalizedStatuses.includes('rejected');
            const totalBaseline = Math.max(0, requiredDocs.length || 0) > 0
                ? requiredDocs.length
                : Math.max(uploadedDocs.length, 1); // ensure baseline >= 1 when there are uploads but no mapping yet
            const compliancePercentage = totalBaseline > 0 && Number.isFinite(approvedCount)
                ? Math.round((approvedCount / totalBaseline) * 100)
                : 0;
            const latestUpdate = uploadedDocs.reduce((latest, doc) => {
                const timestamp = doc.updated_at || doc.created_at;
                if (!timestamp) return latest;
                if (!latest) return timestamp;
                return new Date(timestamp).getTime() > new Date(latest).getTime() ? timestamp : latest;
            }, null);

            let statusLabel = 'No Submission';
            let statusVariant = 'secondary';
            if (uploadedDocs.length > 0) {
                if (hasRevision) {
                    statusLabel = 'Needs Revision';
                    statusVariant = 'danger';
                } else if (hasRejection) {
                    statusLabel = 'Rejected';
                    statusVariant = 'danger';
                } else if (approvedCount > 0) {
                    statusLabel = 'Compliant';
                    statusVariant = 'success';
                } else {
                    statusLabel = 'Pending';
                    statusVariant = 'warning';
                }
            }

            return {
                sectionNumber,
                sectionKey,
                requiredDocs,
                uploadedDocs,
                approvedCount,
                pendingCount,
                flaggedCount,
                hasRevision,
                hasRejection,
                statusLabel,
                statusVariant,
                compliancePercentage,
                totalBaseline,
                latestUpdate,
            };
        });
    }, [sectionNumbers, documents, subSectionsBySection]);

    const sectionsWithBaseline = useMemo(() => sectionInsights.filter((info) => info.totalBaseline > 0), [sectionInsights]);
    const overallCompliance = sectionsWithBaseline.length
        ? Math.round(sectionsWithBaseline.reduce((sum, info) => sum + info.compliancePercentage, 0) / sectionsWithBaseline.length)
        : 0;
    const sectionsAtRisk = useMemo(() => sectionInsights.filter((info) => info.hasRevision || info.hasRejection), [sectionInsights]);
    const sectionsCompleted = useMemo(
        () => sectionInsights.filter((info) => info.totalBaseline > 0 && info.compliancePercentage === 100 && !info.hasRevision && !info.hasRejection),
        [sectionInsights]
    );
    const sectionsInProgress = useMemo(
        () => sectionInsights.filter((info) => info.uploadedDocs.length > 0 && info.compliancePercentage > 0 && info.compliancePercentage < 100 && !info.hasRevision && !info.hasRejection),
        [sectionInsights]
    );
    const sectionsNotStarted = useMemo(
        () => sectionInsights.filter((info) => info.totalBaseline > 0 && info.uploadedDocs.length === 0).length,
        [sectionInsights]
    );

    const outstandingReviews = statusSummary.pending + statusSummary.flagged;
    const lastSubmissionDisplay = statusSummary.lastUpdated ? new Date(statusSummary.lastUpdated).toLocaleString() : 'No submissions yet';
    const submissionRate = totalRequiredItems > 0
        ? Math.min(100, Math.round((statusSummary.total / totalRequiredItems) * 100))
        : (statusSummary.total > 0 ? 100 : 0);
    const averageDocsPerSection = sectionInsights.length ? (statusSummary.total / sectionInsights.length).toFixed(1) : '0.0';

    const prioritySections = useMemo(() => {
        const prioritized = [
            ...sectionsAtRisk,
            ...sectionInsights.filter((info) => !info.hasRevision && !info.hasRejection && info.totalBaseline > 0 && info.compliancePercentage < 60)
        ];
        const unique = [];
        prioritized.forEach((info) => {
            if (!unique.some((item) => item.sectionNumber === info.sectionNumber)) {
                unique.push(info);
            }
        });
        return unique.slice(0, 4);
    }, [sectionsAtRisk, sectionInsights]);

    const statusBreakdown = useMemo(() => ([
        { label: 'Compliant', value: statusSummary.approved, variant: 'success', helper: 'Approved evidence ready for audit' },
        { label: 'Pending Review', value: statusSummary.pending, variant: 'warning', helper: 'Awaiting review or submission' },
        { label: 'Needs Action', value: statusSummary.flagged, variant: 'danger', helper: 'Revision requested or rejected' },
    ]), [statusSummary]);

    const fetchDocuments = async (programId) => {
        const response = await apiFetch(`/api/programs/${programId}/documents`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.message || 'Failed to fetch documents.');
        }
        setDocuments(Array.isArray(data) ? data : []);
    };

    const fetchSubSections = async (programId) => {
        const response = await apiFetch(`/api/programs/${programId}/compliance-matrix`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.message || 'Failed to fetch accreditation criteria.');
        }
        const grouped = data.reduce((acc, item) => {
            const sectionKey = String(item.section ?? '');
            if (!sectionKey) return acc;
            acc[sectionKey] = acc[sectionKey] || [];
            acc[sectionKey].push({
                id: String(item.id),
                code: item.criterion_code,
                label: `${item.criterion_code} • ${item.description}`,
                documentName: item.document_needed || item.document_type_needed || item.description,
            });
            return acc;
        }, {});
        Object.values(grouped).forEach((list) => list.sort((a, b) => a.code.localeCompare(b.code)));
        setSubSectionsBySection(grouped);
    };

    const handleProgramChange = (event) => {
        setSelectedProgramId(event.target.value);
    };

    const handleOpenUpload = (section) => {
        setUploadError('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setUploadModal({ show: true, section: String(section) });
    };

    const handleCloseUpload = () => {
        setUploadModal({ show: false, section: null });
        setSelectedFile(null);
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files?.[0] || null);
    };

    const handleUploadSubmit = async (event) => {
        event.preventDefault();
        if (!selectedProgramId || !uploadModal.section || !selectedFile) {
            setUploadError('Please select a file to upload.');
            return;
        }
        setIsUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('section', uploadModal.section);
        const options = subSectionsBySection[String(uploadModal.section)] || [];
        const selectedMeta = options.find((opt) => opt.id === selectedSubSection);
        if (selectedMeta?.documentName) {
            formData.append('document_name', selectedMeta.documentName);
        }
        try {
            const response = await apiFetch(`/api/programs/${selectedProgramId}/documents`, {
                method: 'POST',
                body: formData,
                headers: {},
            });
            const data = await response.json();
            if (!response.ok) {
                const message = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Upload failed.');
                throw new Error(message);
            }
            await fetchDocuments(selectedProgramId);
            handleCloseUpload();
        } catch (err) {
            console.error('Failed to upload document', err);
            setUploadError(err.message || 'Upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    const openCommentModal = (sectionNumber) => {
        setCommentModal({ show: true, section: sectionNumber });
        loadSectionComments(sectionNumber);
    };

    const closeCommentModal = () => {
        setCommentModal({ show: false, section: null });
        setSectionComments([]);
    };

    const handleMarkCompliant = async (documentId) => {
        setReviewingDocumentId(documentId);
        try {
            const response = await apiFetch(`/api/documents/${documentId}/approve`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to update status.');
            }
            await fetchDocuments(selectedProgramId);
        } catch (err) {
            notify.error('Update failed', err.message || 'Failed to update status.');
        } finally {
            setReviewingDocumentId(null);
        }
    };

    const handlePreview = async (doc) => {
        const title = doc?.name || doc?.original_name || `Document #${doc?.id ?? ''}`;
        // Try to get a temporary signed URL from the API to avoid 404/public access issues
        if (doc?.id) {
            try {
                const res = await apiFetch(`/api/documents/${doc.id}/signed-url`);
                if (res.ok) {
                    const data = await res.json();
                    setPreview({ show: true, title, url: data.url, originalPath: doc?.path || '' });
                    return;
                }
            } catch (_) { /* fall back */ }
        }
        const fileUrl = buildStorageUrl(doc?.path);
        setPreview({ show: true, title, url: fileUrl, originalPath: doc?.path || '' });
    };

    return (
        <div className="content-card">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <div>
                    <h1 className="mb-1">Program Health Dashboard</h1>
                    <p className="text-muted mb-0">Executive overview of accreditation evidence, compliance levels, and operational priorities.</p>
                </div>
                <div style={{ minWidth: '260px' }}>
                    <Form.Group className="mb-0">
                        <Form.Label className="text-muted small">Select Program</Form.Label>
                        <Form.Select value={selectedProgramId} onChange={handleProgramChange}>
                            {programs.length === 0 && <option value="">No programs available</option>}
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.code ? `${program.code} • ${program.name}` : program.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </div>
            </div>
            {currentProgram && (
                <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                    <div className="fw-semibold text-uppercase text-muted small">{currentProgram.code || currentProgram.name}</div>
                    {currentProgram.code && currentProgram.name && currentProgram.code !== currentProgram.name && (
                        <div className="text-muted small">{currentProgram.name}</div>
                    )}
                    {currentProgram.status && (
                        <Badge bg={String(currentProgram.status).toLowerCase() === 'active' ? 'primary' : 'secondary'} className="text-uppercase">
                            {currentProgram.status}
                        </Badge>
                    )}
                    {currentProgram.accreditation_level && (
                        <Badge bg="info" text="dark">Level: {currentProgram.accreditation_level}</Badge>
                    )}
                </div>
            )}
            {!isLoading && !error && (
                <>
                    {/* Assigned action plans for the coordinator (selected program + all programs) */}
                    <Row className="g-3 mb-4">
                        <Col lg={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">My Assigned Action Plans (Current Program)</h5>
                                    <small className="text-muted">Action plans assigned to you for {currentProgram ? (currentProgram.code || currentProgram.name) : 'the selected program'}</small>
                                </Card.Header>
                                <Card.Body>
                                    {assignedActionPlans.length === 0 ? (
                                        <div className="text-muted text-center py-3">No action plans assigned to you in this program.</div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {assignedActionPlans.map((ap) => (
                                                <ListGroup.Item key={`ap-${ap.id}`} className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <div className="fw-semibold">{ap.title}</div>
                                                        <div className="text-muted small">{ap.description || 'No description'}</div>
                                                        <div className="text-muted small">Status: {ap.status || 'Not Started'} • Due: {ap.due_date || 'N/A'}</div>
                                                    </div>
                                                    <div className="text-end">
                                                        <Button size="sm" variant="outline-primary" onClick={() => window.open(`/action-plans/${ap.id}`, '_blank')}>Open</Button>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">My Assigned Action Plans (All Programs)</h5>
                                    <small className="text-muted">Active action plans assigned to you across all programs</small>
                                </Card.Header>
                                <Card.Body>
                                    {assignedAllLoading ? (
                                        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                                    ) : assignedAllActionPlans.length === 0 ? (
                                        <div className="text-muted text-center py-3">No assigned action plans found.</div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {assignedAllActionPlans.map((ap) => (
                                                <ListGroup.Item key={`ap-all-${ap.id}`} className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <div className="fw-semibold">{ap.title} <small className="text-muted">• {ap._program?.code || ap._program?.name}</small></div>
                                                        <div className="text-muted small">{ap.description || 'No description'}</div>
                                                        <div className="text-muted small">Status: {ap.status || 'Not Started'} • Due: {ap.due_date || 'N/A'}</div>
                                                    </div>
                                                    <div className="text-end">
                                                        <Button size="sm" variant="outline-primary" onClick={() => window.open(`/action-plans/${ap.id}`, '_blank')}>Open</Button>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="g-3 mb-4">
                        <Col xl={3} md={6}>
                            <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: '#fff' }}>
                                <Card.Body>
                                    <Card.Title className="text-uppercase small fw-semibold mb-3 text-white-50">Overall Compliance</Card.Title>
                                    <div className="display-5 fw-bold">{overallCompliance}<span className="fs-5">%</span></div>
                                    <ProgressBar className="mt-3" now={overallCompliance} variant="light" style={{ height: '0.5rem', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                    <div className="d-flex justify-content-between mt-3">
                                        <small className="text-white-50">Sections completed</small>
                                        <small className="fw-semibold">{sectionsCompleted.length} of {sectionInsights.length}</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <Card.Title className="text-uppercase small fw-semibold text-muted mb-3">Evidence Pipeline</Card.Title>
                                    <div className="d-flex align-items-baseline justify-content-between">
                                        <div className="display-6 fw-bold text-primary">{statusSummary.total}</div>
                                        <div className="text-muted small text-end">
                                            <div>Total submissions</div>
                                            <div>{totalRequiredItems ? `of ${totalRequiredItems} required` : 'Mapped items pending'}</div>
                                        </div>
                                    </div>
                                    <ProgressBar className="mt-3" now={submissionRate} variant="info" style={{ height: '0.45rem' }} />
                                    <div className="d-flex justify-content-between mt-3 text-muted small">
                                        <span>Avg docs / section</span>
                                        <span className="fw-semibold text-dark">{averageDocsPerSection}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <Card.Title className="text-uppercase small fw-semibold text-muted mb-3">Review Queue</Card.Title>
                                    <div className="display-6 fw-bold text-warning">{outstandingReviews}</div>
                                    <div className="text-muted small">Items awaiting action</div>
                                    <div className="d-flex justify-content-between mt-3">
                                        <Badge bg="warning" text="dark">Pending {statusSummary.pending}</Badge>
                                        <Badge bg="danger">Needs Action {statusSummary.flagged}</Badge>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <Card.Title className="text-uppercase small fw-semibold text-muted mb-3">Operational Pulse</Card.Title>
                                    <div className="text-dark fw-bold">Last submission</div>
                                    <div className="text-muted">{lastSubmissionDisplay}</div>
                                    <div className="d-flex gap-3 mt-3 text-center">
                                        <div className="flex-fill">
                                            <div className="h5 mb-0 text-success">{sectionsCompleted.length}</div>
                                            <small className="text-muted">Completed</small>
                                        </div>
                                        <div className="flex-fill">
                                            <div className="h5 mb-0 text-primary">{sectionsInProgress.length}</div>
                                            <small className="text-muted">In Progress</small>
                                        </div>
                                        <div className="flex-fill">
                                            <div className="h5 mb-0 text-danger">{sectionsAtRisk.length}</div>
                                            <small className="text-muted">At Risk</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="g-3 mb-4">
                        <Col xl={5} lg={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">Priority Watchlist</h5>
                                    <small className="text-muted">Sections needing executive follow-up</small>
                                </Card.Header>
                                <Card.Body>
                                    {prioritySections.length === 0 ? (
                                        <div className="text-muted text-center py-3">No critical issues detected. Keep the momentum!</div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {prioritySections.map((info) => (
                                                <ListGroup.Item key={`priority-${info.sectionNumber}`} className="px-0 d-flex justify-content-between align-items-start gap-3">
                                                    <div>
                                                        <div className="fw-semibold">Section {info.sectionNumber}</div>
                                                        <div className="text-muted small">
                                                            {info.statusLabel} • {info.compliancePercentage}% compliant
                                                            {info.latestUpdate && (
                                                                <> • Updated {new Date(info.latestUpdate).toLocaleDateString()}</>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge bg={info.statusVariant}>{info.statusLabel}</Badge>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={7} lg={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">Evidence Mix</h5>
                                    <small className="text-muted">Distribution of submissions by workflow state</small>
                                </Card.Header>
                                <Card.Body>
                                    {statusBreakdown.map((item) => (
                                        <div key={item.label} className="d-flex justify-content-between align-items-start border-bottom py-3">
                                            <div>
                                                <div className="fw-semibold d-flex align-items-center gap-2">
                                                    <span className={`badge bg-${item.variant}`}>{item.label}</span>
                                                    <span>{item.value}</span>
                                                </div>
                                                <div className="text-muted small">{item.helper}</div>
                                            </div>
                                            <div className="display-6 fw-bold text-muted">{item.value}</div>
                                        </div>
                                    ))}
                                    <div className="mt-4 p-3 bg-light rounded">
                                        <div className="fw-semibold mb-2">Section Status Overview</div>
                                        <div className="d-flex flex-wrap gap-3">
                                            <div>
                                                <div className="h5 mb-0 text-success">{sectionsCompleted.length}</div>
                                                <small className="text-muted">Completed</small>
                                            </div>
                                            <div>
                                                <div className="h5 mb-0 text-primary">{sectionsInProgress.length}</div>
                                                <small className="text-muted">In Progress</small>
                                            </div>
                                            <div>
                                                <div className="h5 mb-0 text-danger">{sectionsAtRisk.length}</div>
                                                <small className="text-muted">At Risk</small>
                                            </div>
                                            <div>
                                                <div className="h5 mb-0 text-secondary">{sectionsNotStarted}</div>
                                                <small className="text-muted">Not Started</small>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="g-3 mb-4">
                        <Col xl={12}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                        <div>
                                            <h5 className="mb-0">Admin Notes Overview</h5>
                                            <small className="text-muted">Latest guidance shared by accreditation administrators</small>
                                        </div>
                                        <div className="d-flex gap-3 text-muted small">
                                            <div>
                                                <div className="h5 mb-0 text-primary">{commentSummary.length}</div>
                                                <div>Sections with notes</div>
                                            </div>
                                            <div>
                                                <div className="h5 mb-0 text-secondary">{totalCommentCount}</div>
                                                <div>Total notes</div>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    {commentSummary.length === 0 ? (
                                        <div className="text-muted text-center py-3">No admin notes yet. New feedback will appear here automatically.</div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {commentSummary.slice(0, 5).map((entry) => {
                                                const { section, count, latest } = entry;
                                                const authorName = latest?.author?.name || 'Admin';
                                                const noteDate = latest?.created_at ? new Date(latest.created_at).toLocaleString() : 'Recently';
                                                const notePreview = (latest?.comment || '').trim();
                                                const displayPreview = notePreview.length > 200 ? `${notePreview.slice(0, 197)}...` : notePreview;
                                                return (
                                                    <ListGroup.Item key={`admin-note-${section}-${latest?.id || 'latest'}`} className="px-0 py-3">
                                                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                                                    <Badge bg="primary">Section {section}</Badge>
                                                                    <span className="fw-semibold">{authorName}</span>
                                                                    <small className="text-muted">{noteDate}</small>
                                                                </div>
                                                                <div className="text-muted small" style={{ whiteSpace: 'pre-wrap' }}>{displayPreview || 'No additional details provided.'}</div>
                                                            </div>
                                                            <div className="text-nowrap">
                                                                <Button variant="outline-primary" size="sm" onClick={() => openCommentModal(section)}>
                                                                    View Notes ({count})
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </ListGroup.Item>
                                                );
                                            })}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
            {error && <Alert variant="danger">{error}</Alert>}
            {isLoading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : (
                sectionInsights.map((info) => {
                    const {
                        sectionNumber,
                        requiredDocs,
                        uploadedDocs,
                        approvedCount,
                        pendingCount,
                        flaggedCount,
                        statusLabel,
                        statusVariant,
                        compliancePercentage,
                        latestUpdate,
                    } = info;
                    const sectionNotes = sectionCommentMap[sectionNumber] || [];
                    const latestSectionNote = sectionNotes[0];
                    const notePreviewText = latestSectionNote?.comment ? latestSectionNote.comment.trim() : '';
                    const truncatedPreview = notePreviewText.length > 160 ? `${notePreviewText.slice(0, 157)}...` : notePreviewText;
                    const noteAuthor = latestSectionNote?.author?.name || 'Admin';
                    const noteDate = latestSectionNote?.created_at ? new Date(latestSectionNote.created_at).toLocaleString() : null;

                    return (
                        <Card className="mb-4 shadow-sm" key={`section-${sectionNumber}`}>
                            <Card.Header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                                <div>
                                    <h5 className="mb-1">Section {sectionNumber}</h5>
                                    <div className="text-muted small">{requiredDocs.length > 0 ? `${requiredDocs.length} required evidence items` : 'No mapped requirements yet.'}</div>
                                </div>
                                <div className="text-lg-end">
                                    <Badge bg={statusVariant} pill className="mb-1">{statusLabel}</Badge>
                                    <div className="text-muted small">{approvedCount} compliant • {uploadedDocs.length} submitted</div>
                                    {latestUpdate && (
                                        <div className="text-muted small">Updated {new Date(latestUpdate).toLocaleString()}</div>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                                    <div className="flex-grow-1">
                                        {(() => {
                                            const safeNow = Number.isFinite(Number(compliancePercentage))
                                                ? Math.min(100, Math.max(0, Number(compliancePercentage)))
                                                : 0;
                                            return (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="fw-semibold">Progress</div>
                                                        <div className="text-muted small"><span className="fw-semibold">{safeNow}%</span></div>
                                                    </div>
                                                    <div className="progress mt-2" style={{ height: '0.6rem' }} aria-label={`Section ${sectionNumber} compliance`}>
                                                        <div
                                                            className={`progress-bar ${statusVariant ? `bg-${statusVariant}` : ''} ${statusVariant === 'warning' ? 'progress-bar-striped progress-bar-animated' : ''}`}
                                                            role="progressbar"
                                                            style={{ width: `${safeNow}%` }}
                                                            aria-valuenow={safeNow}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                        />
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <Button
                                        variant="primary"
                                        style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}
                                        onClick={() => handleOpenUpload(sectionNumber)}
                                        disabled={!selectedProgramId}
                                    >
                                        <i className="bi bi-upload me-2"></i>
                                        Upload Evidence
                                    </Button>
                                </div>
                                {uploadedDocs.length === 0 ? (
                                    <Alert variant="light" className="mb-3">No submissions yet for this section.</Alert>
                                ) : (
                                    <div className="table-responsive mb-3">
                                        <Table hover size="sm" className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Document</th>
                                                    <th>Uploaded By</th>
                                                    <th>Last Updated</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uploadedDocs.map((doc) => {
                                                    const statusMeta = getDocumentStatusMeta(doc.status);
                                                    const fileUrl = buildStorageUrl(doc.path);
                                                    const updatedAt = doc.updated_at || doc.created_at;
                                                    const uploaderName = doc.uploader?.name || doc.uploader?.email || '—';
                                                    return (
                                                        <tr key={doc.id}>
                                                            <td>
                                                                <div className="fw-semibold">{doc.name || doc.original_name || `Document #${doc.id}`}</div>
                                                                {doc.description && <div className="text-muted small">{doc.description}</div>}
                                                            </td>
                                                            <td>{uploaderName}</td>
                                                            <td>{updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</td>
                                                            <td><Badge bg={statusMeta.variant}>{statusMeta.label}</Badge></td>
                                                            <td className="text-end">
                                                                <div className="d-inline-flex gap-2">
                                                                    {fileUrl && (
                                                                        <Button
                                                                                variant="secondary"
                                                                            size="sm"
                                                                            onClick={() => handlePreview(doc)}
                                                                        >
                                                                            View
                                                                        </Button>
                                                                    )}
                                                                    {fileUrl && (
                                                                        <Button
                                                                            as="a"
                                                                            variant="primary"
                                                                            size="sm"
                                                                            href={fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            title="Download file"
                                                                        >
                                                                            Download
                                                                        </Button>
                                                                    )}
                                                                    {canReview && String(doc.status || '').toLowerCase() !== 'approved' && (
                                                                        <Button
                                                                            variant="success"
                                                                            size="sm"
                                                                            onClick={() => handleMarkCompliant(doc.id)}
                                                                            disabled={reviewingDocumentId === doc.id}
                                                                        >
                                                                            {reviewingDocumentId === doc.id ? <Spinner as="span" animation="border" size="sm" /> : 'Mark Compliant'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                                <div className="d-flex flex-column flex-lg-row gap-3">
                                    <div className="flex-grow-1">
                                        <h6 className="mb-2">Required Evidence</h6>
                                        {requiredDocs.length === 0 ? (
                                            <Alert variant="secondary" className="mb-0">No required evidence mapped yet.</Alert>
                                        ) : (
                                            <ListGroup variant="flush" className="small">
                                                {requiredDocs.map((item) => (
                                                    <ListGroup.Item key={item.id} className="px-0">
                                                        <div className="fw-semibold">{item.label}</div>
                                                        {item.documentName && <div className="text-muted">Suggested: {item.documentName}</div>}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="mb-2">Submission Insights</h6>
                                        <ListGroup variant="flush" className="small">
                                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Submitted</span><span>{uploadedDocs.length}</span></ListGroup.Item>
                                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Compliant</span><span>{approvedCount}</span></ListGroup.Item>
                                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Pending Review</span><span>{pendingCount}</span></ListGroup.Item>
                                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Needs Action</span><span>{flaggedCount}</span></ListGroup.Item>
                                        </ListGroup>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="mb-2">Admin Notes</h6>
                                        {sectionNotes.length === 0 ? (
                                            <Alert variant="light" className="mb-0">
                                                No notes yet for this section. Updates from administrators will appear here.
                                            </Alert>
                                        ) : (
                                            <div className="d-flex flex-column gap-2">
                                                <div className="text-muted small">
                                                    Latest from <span className="fw-semibold">{noteAuthor}</span>
                                                    {noteDate && <span> • {noteDate}</span>}
                                                </div>
                                                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{truncatedPreview}</div>
                                            </div>
                                        )}
                                        <div className="mt-3">
                                            <Button variant="outline-primary" size="sm" onClick={() => openCommentModal(sectionNumber)}>
                                                View Notes ({sectionNotes.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })
            )}

            <Modal show={uploadModal.show} onHide={handleCloseUpload} centered>
                <Form onSubmit={handleUploadSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Upload Evidence for Section {uploadModal.section}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {uploadError && <Alert variant="danger">{uploadError}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Section</Form.Label>
                            <Form.Control value={`Section ${uploadModal.section || ''}`} disabled />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Sub Section</Form.Label>
                            <Form.Select
                                value={selectedSubSection}
                                onChange={(event) => setSelectedSubSection(event.target.value)}
                                disabled={(subSectionsBySection[String(uploadModal.section)] || []).length === 0}
                            >
                                {(subSectionsBySection[String(uploadModal.section)] || []).length === 0 ? (
                                    <option value="">No subsections found for this section</option>
                                ) : (
                                    (subSectionsBySection[String(uploadModal.section)] || []).map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))
                                )}
                            </Form.Select>
                            {(subSectionsBySection[String(uploadModal.section)] || []).length === 0 && (
                                <Form.Text muted>Uploads will be recorded against the general section requirement.</Form.Text>
                            )}
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Select File</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const allowedTypes = [
                                            'application/pdf',
                                            'application/msword',
                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        ];
                                        const allowedExts = ['.pdf', '.doc', '.docx'];
                                        const fileName = file.name.toLowerCase();
                                        const hasValidExt = allowedExts.some(ext => fileName.endsWith(ext));
                                        if (!allowedTypes.includes(file.type) && !hasValidExt) {
                                            setUploadError('Only PDF, DOC, and DOCX files are allowed.');
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                            return;
                                        }
                                    }
                                    setUploadError('');
                                    setSelectedFile(file || null);
                                }}
                                ref={fileInputRef}
                                required
                            />
                            <Form.Text muted>Accepted formats: PDF, DOC, DOCX (max 20MB).</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseUpload}>Cancel</Button>
                        <Button type="submit" disabled={isUploading} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                            {isUploading ? <Spinner as="span" animation="border" size="sm" /> : 'Upload Document'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <DocumentViewerModal
                show={preview.show}
                onHide={() => setPreview({ show: false, title: '', url: '' })}
                title={preview.title}
                src={preview.url}
                originalPath={preview.originalPath}
            />
            <Modal show={commentModal.show} onHide={closeCommentModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Section {commentModal.section} Admin Notes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoadingSectionComments ? (
                        <div className="text-center text-muted py-3">
                            <Spinner animation="border" size="sm" /> Loading notes...
                        </div>
                    ) : sectionComments.length === 0 ? (
                        <Alert variant="secondary" className="mb-0">No notes have been shared for this section yet.</Alert>
                    ) : (
                        <ListGroup variant="flush">
                            {sectionComments.map((comment) => (
                                <ListGroup.Item key={comment.id} className="px-0 py-3">
                                    <div className="d-flex flex-column gap-1">
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className="fw-semibold">{comment.author?.name || 'Admin'}</span>
                                            <small className="text-muted">{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</small>
                                        </div>
                                        <div className="text-muted small">To: {comment.coordinator?.name || 'You'}</div>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeCommentModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

function ActionPlansOverviewPage({ onSelectProgram }) {
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const filteredPrograms = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return programs;
        return programs.filter((program) => {
            const code = (program.code || '').toLowerCase();
            const name = (program.name || '').toLowerCase();
            const level = (program.accreditation_level || '').toLowerCase();
            const status = (program.status || '').toLowerCase();
            return code.includes(query) || name.includes(query) || level.includes(query) || status.includes(query);
        });
    }, [programs, searchTerm]);

    useEffect(() => {
        const loadPrograms = async () => {
            try {
                const response = await apiFetch('/api/programs');
                if (!response.ok) throw new Error('Failed to load programs.');
                setPrograms(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadPrograms();
    }, []);

    return (
        <div className="content-card">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h1 className="mb-1">Action Plans</h1>
                    <p className="text-muted mb-0">Monitor remediation efforts for each program and assign owners.</p>
                </div>
                <Form.Control
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search programs..."
                    style={{ maxWidth: '260px' }}
                />
            </div>
            {isLoading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : programs.length === 0 ? (
                <div className="text-center py-5 text-muted">No programs available yet.</div>
            ) : filteredPrograms.length === 0 ? (
                <div className="text-center py-5 text-muted">No programs match your search.</div>
            ) : (
                <Row className="g-4">
                    {filteredPrograms.map(program => {
                        const statusText = program.status || 'In Progress';
                        const statusVariant = String(program.status || '').toLowerCase() === 'inactive' ? 'danger' : 'success';
                        return (
                            <Col md={6} key={program.id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h5 className="mb-1">{program.code || program.name}</h5>
                                                {program.code && program.name && program.code !== program.name && (
                                                    <div className="text-muted small mb-1">{program.name}</div>
                                                )}
                                                <small className="text-muted">Accreditation Level: {program.accreditation_level || 'N/A'}</small>
                                            </div>
                                            <Badge bg={statusVariant} pill>{statusText}</Badge>
                                        </div>
                                        <Button variant="primary" onClick={() => onSelectProgram(program)} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                                            <i className="bi bi-list-task me-2"></i>
                                            Manage Action Plans
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
}

// --- Main App Component ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUser = async (freshLogin = false) => {
    try {
        const response = await apiFetch('/api/user');
        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();
        setUser(userData);
        // If this fetch was triggered by a fresh login, only pull unread notifications
        if (freshLogin) {
            // fetch only unread/new notifications and merge
            try { await fetchNotifications(true); } catch (e) { /* ignore */ }
        }
    } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout(false); // Logout without API call if token is invalid
    } finally {
        setIsAuthLoading(false);
    }
  };
  
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setIsAuthLoading(true); // Show loader while fetching user after login
        fetchUser(true);
  };

  const handleLogout = (withApiCall = true) => {
    if (withApiCall) {
        apiFetch('/api/logout', { method: 'POST' });
    }
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };
  
  useEffect(() => {
        if (token) {
            // Normal auth check on page load should fetch full notification list
            fetchUser(false);
        } else {
            setIsAuthLoading(false);
        }
  }, [token]);

  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

    return token && user
        ? <DashboardLayout user={user} onLogout={handleLogout} setUser={setUser} />
        : <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

// --- 2FA View Component ---
function TwoFactorAuthView({ email, onLoginSuccess, pendingToken, onCancel }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmation, setConfirmation] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setConfirmation('');
        try {
            const response = await apiFetch('/api/verify-2fa', {
                method: 'POST',
                body: JSON.stringify({ email, code, two_factor_token: pendingToken }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Verification failed.');
            if (data.access_token) {
                onLoginSuccess(data.access_token);
            } else {
                throw new Error('No access token received.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        setError('');
        setConfirmation('');
        try {
            const response = await apiFetch('/api/resend-2fa', {
                method: 'POST',
                body: JSON.stringify({ two_factor_token: pendingToken }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to resend the code.');
            setConfirmation('A new verification code has been sent.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '380px', width: '100%' }}>
            <div className="text-center mb-4"><img src={logoUrl} alt="Logo" style={{ width: '120px' }} /><h2 className="mt-3 fw-bold">Enter Verification Code</h2></div>
            <p className="text-center text-muted">A 6-digit code has been sent to <strong>{email}</strong>. Please enter it below.</p>
            {error && <Alert variant="danger">{error}</Alert>}
            {confirmation && <Alert variant="success">{confirmation}</Alert>}
            <Form onSubmit={handleVerify}>
                <Form.Group className="mb-4">
                    <Form.Label>Verification Code <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                        type="text" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        required 
                        maxLength="6"
                        style={{ borderRadius: '0.5rem', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }} 
                    />
                </Form.Group>
                <div className="d-grid gap-2">
                    <Button type="submit" disabled={isLoading} style={{ backgroundColor: 'var(--primary-purple)', border: 'none', width: '100%', borderRadius: '2rem', fontWeight: '700', padding: '0.75rem' }}>
                        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Verify & Sign In'}
                    </Button>
                    <Button variant="secondary" type="button" onClick={handleResend} disabled={isLoading} style={{ borderRadius: '2rem', fontWeight: '600', padding: '0.65rem' }}>
                        Resend Code
                    </Button>
                    {onCancel && (
                        <Button variant="link" type="button" onClick={onCancel} disabled={isLoading} className="text-muted">
                            Use a different account
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    );
}

// --- Login Page Component ---
function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPendingToken('');
    try {
        const response = await apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed.');
        
        if (data.two_factor_token) {
            setPendingToken(data.two_factor_token);
        } else if (data.access_token) {
            onLoginSuccess(data.access_token);
        } else {
            throw new Error('Login failed: No access token received.');
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

    const mainContainerStyles = { display: 'flex', height: '100vh', width: '100%', fontFamily: "Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" };
  const formColumnStyles = { flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem' };
  const brandingColumnStyles = { flex: '1 1 50%', backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'left' };

  return (
    <div style={mainContainerStyles}>
      <div style={formColumnStyles}>
        {pendingToken ? (
                        <TwoFactorAuthView
                                email={email}
                                pendingToken={pendingToken}
                                onLoginSuccess={onLoginSuccess}
                                onCancel={() => {
                                        setPendingToken('');
                                        setPassword('');
                                }}
                        />
        ) : (
            <div style={{ maxWidth: '380px', width: '100%' }}>
              <div className="text-center mb-4"><img src={logoUrl} alt="Logo" style={{ width: '120px' }} /><h2 className="mt-3 fw-bold">Sign in</h2></div>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3"><Form.Label>Username <span className="text-danger">*</span></Form.Label><Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ borderRadius: '0.5rem' }} /></Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required style={{ borderRadius: '0.5rem' }} />
                                </Form.Group>
                <Button type="submit" disabled={isLoading} style={{ backgroundColor: 'var(--primary-purple)', border: 'none', width: '100%', borderRadius: '2rem', fontWeight: '700', padding: '0.75rem' }}>
                    {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Sign in'}
                </Button>
              </Form>
            </div>
        )}
            </div>
            <div style={brandingColumnStyles} className="d-none d-lg-flex">
                <div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '700' }}>School Management<br />System III</h1>
                    <p>Accreditation Management System</p>
                </div>
            </div>
        </div>
  );
}

function Sidebar({ user, onViewChange, currentView, isVisible, canAccessCoordinatorDashboard }) {
    const roleName = user && user.role && user.role.name ? user.role.name.toLowerCase() : '';
    const isAdmin = roleName === 'admin';
    const isCoordinator = roleName === 'program_coordinator';
    const isReviewer = false; // No external reviewers in this setup
    const getInitials = (name) => !name ? '' : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const getDisplayName = (currentUser) => !currentUser ? 'Loading...' : [currentUser.name, currentUser.middle_name, currentUser.last_name, currentUser.suffix].filter(Boolean).join(' ');
    const formatRole = (role) => !role ? 'User' : role.name.toUpperCase();

    const mainMenuItems = [
        // Only one dashboard: coordinators see Coordinator Dashboard; others see Dashboard
        canAccessCoordinatorDashboard
            ? { label: 'Coordinator Dashboard', view: 'COORDINATOR_DASHBOARD', icon: 'bi-clipboard-check', match: ['COORDINATOR_DASHBOARD'] }
            : { label: 'Dashboard', view: 'DASHBOARD', icon: 'bi-speedometer2', match: ['DASHBOARD'] },
        // Show Program Management only for admins
        ...(isAdmin ? [{ label: 'Program Management', view: 'PROGRAMS', icon: 'bi-journal-text', match: ['PROGRAMS'] }] : []),
        { label: 'Document Repository', view: 'DOCUMENT_REPOSITORY', icon: 'bi-folder2-open', match: ['DOCUMENT_REPOSITORY', 'DOCUMENTS'] },
        { label: 'Compliance Matrix', view: 'COMPLIANCE', icon: 'bi-card-checklist', match: ['COMPLIANCE'] },
        // SAR Builder is visible only to Admin and Program Coordinator
        ...((isAdmin || isCoordinator) ? [{ label: 'SAR Builder', view: 'SAR_OVERVIEW', icon: 'bi-journal-check', match: ['SAR_OVERVIEW', 'SAR_EDITOR'] }] : []),
    ];

    const sections = [
        {
            key: 'main',
            heading: 'Main Menu',
            items: mainMenuItems,
        },
        {
            key: 'administration',
            heading: 'Administration',
            adminOnly: true,
            items: [
                { label: 'Facilities Monitoring', view: 'FACILITIES', icon: 'bi-building', match: ['FACILITIES'] },
                { label: 'Action Plans', view: 'ACTION_PLANS_OVERVIEW', icon: 'bi-list-check', match: ['ACTION_PLANS_OVERVIEW', 'ACTION_PLANS'] },
                { label: 'Audit Scheduler', view: 'AUDIT_SCHEDULE', icon: 'bi-calendar-check', match: ['AUDIT_SCHEDULE'] },
                { label: 'Accreditor Visits', view: 'ACCREDITOR_VISIT', icon: 'bi-briefcase', match: ['ACCREDITOR_VISIT'] },
                { label: 'User Management', view: 'USERS', icon: 'bi-people', match: ['USERS', 'QUALIFICATIONS'] },
            ],
        },
        {
            key: 'account',
            heading: 'Account',
            items: [
                // My Reviews for Admin only (Admin acts as reviewer)
                ...(isAdmin ? [{ label: 'My Reviews', view: 'MY_REVIEWS', icon: 'bi-clipboard-data', match: ['MY_REVIEWS'] }] : []),
                { label: 'Profile', view: 'PROFILE', icon: 'bi-person-circle', match: ['PROFILE'] },
            ],
        },
    ];

    const filteredSections = sections.filter(section => !section.adminOnly || isAdmin);
    const isItemActive = (item) => (item.match || []).includes(currentView);

    return (
        <aside className={`sidebar ${isVisible ? 'visible' : 'collapsed'}`}>
            <div className="sidebar-profile">
                <div className="sidebar-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center w-100 h-100">{getInitials(user?.name)}</div>
                    )}
                </div>
                <div className="sidebar-name">{getDisplayName(user)}</div>
                <div className="sidebar-email">{user?.email || 'Loading...'}</div>
                <div className="sidebar-role">{formatRole(user?.role)}</div>
            </div>
            <div className="sidebar-divider"></div>
            {filteredSections.map(section => (
                <div className="sidebar-section" key={section.key}>
                    <h6>{section.heading}</h6>
                    <div className="sidebar-links">
                        {section.items.map(item => (
                            <button
                                key={item.view}
                                type="button"
                                className={`sidebar-link ${isItemActive(item) ? 'active' : ''}`}
                                onClick={() => onViewChange(item.view)}
                            >
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </aside>
    );
}

function TopNavbar({ onLogout, onToggleSidebar, currentView, user, onViewChange, notifications, unreadCount = 0, onMarkAsRead, onMarkAllRead, onClearAll, onDeleteNotification }) {
    const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })), 1000);
        return () => clearInterval(timer);
    }, []);
    const pageTitle = currentView.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <header className="top-header">
            <div className="header-left">
                <button type="button" className="menu-btn" onClick={onToggleSidebar}>
                    <i className="bi bi-list"></i>
                </button>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                            <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('DASHBOARD'); }}>AMS Portal</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">{pageTitle}</li>
                    </ol>
                </nav>
            </div>
            <div className="header-right">
                <span>{time}</span>
                <Dropdown autoClose="outside">
                    <Dropdown.Toggle as="a" href="#" className="text-secondary position-relative" style={{ textDecoration: 'none' }}>
                        <i className="bi bi-bell-fill fs-5"></i>
                        {unreadCount > 0 && (
                            <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6em' }}>
                                {unreadCount}
                            </Badge>
                        )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="p-2 shadow-lg" style={{ width: '380px', maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center px-2 pb-2">
                            <h6 className="mb-0">Notifications</h6>
                            <div>
                                <Button variant="link" size="sm" className="text-decoration-none" onClick={onMarkAllRead}>Mark all read</Button>
                                <Button variant="link" size="sm" className="text-decoration-none text-danger" onClick={onClearAll}>Clear all</Button>
                            </div>
                        </div>
                        <Dropdown.Divider className="my-0" />
                        {notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const isRead = !!notification.read_at;
                                const icon = notification.type === 'broadcast' ? 'bi-megaphone' : (notification.type === 'warning' ? 'bi-exclamation-triangle' : (notification.type === 'error' ? 'bi-x-circle' : 'bi-bell'));
                                const variant = notification.type === 'warning' ? 'text-warning' : (notification.type === 'error' ? 'text-danger' : 'text-primary');
                                return (
                                    <Dropdown.Item key={notification.id} className={`notification-item d-flex align-items-start p-2 ${isRead ? 'opacity-75' : ''}`}>
                                        <div className="flex-grow-1" onClick={() => onMarkAsRead(notification.id)}>
                                            <div className="fw-semibold d-flex align-items-center gap-2">
                                                <i className={`bi ${icon} ${variant}`}></i>
                                                <span>{notification.title || (notification.type === 'broadcast' ? 'Announcement' : 'New Update')}</span>
                                            </div>
                                            <div className="text-muted small">{notification.message}</div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(notification.created_at).toLocaleString()}</div>
                                        </div>
                                        <Button variant="close" className="ms-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteNotification(notification.id); }} />
                                    </Dropdown.Item>
                                );
                            })
                        ) : (
                            <div className="text-center p-3">
                                <i className="bi bi-bell fs-2 text-muted"></i>
                                <p className="mt-2 mb-0">No new notifications</p>
                            </div>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                    <Dropdown.Toggle as="a" href="#" className="text-secondary" style={{ textDecoration: 'none' }}>
                        <i className="bi bi-person-circle fs-4"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Header>
                            Signed in as
                            <br />
                            <strong>{user?.email}</strong>
                        </Dropdown.Header>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => onViewChange('PROFILE')}>
                            <i className="bi bi-person-fill me-2"></i> Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={onLogout}>
                            <i className="bi bi-box-arrow-right me-2"></i> Sign out
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
}
  
  function DashboardHomepage() {
    const [analysisData, setAnalysisData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiStates, setAiStates] = useState({});
    const [showAiModal, setShowAiModal] = useState(false);
    const [activeProgramId, setActiveProgramId] = useState(null);

      useEffect(() => {
          const fetchData = async () => {
              setIsLoading(true);
              try {
                  const response = await apiFetch('/api/gap-analysis/overall-status');
                  const data = await response.json();
                  if (!response.ok) throw new Error(data?.message || 'Failed to fetch analysis data.');
                  setAnalysisData(Array.isArray(data) ? data : []);
                  setError('');
              } catch (err) {
                  setError(err.message || 'Failed to fetch analysis data.');
              } finally {
                  setIsLoading(false);
              }
          };
          fetchData();
          const onRefresh = () => fetchData();
          window.addEventListener('dashboard:refresh', onRefresh);
          return () => window.removeEventListener('dashboard:refresh', onRefresh);
      }, []);

      useEffect(() => {
          if (!analysisData.length) {
              setAiStates({});
              return;
          }

          const cache = readAiCache();
          let cacheMutated = false;
          const cacheUpdates = {};
          const validProgramIds = new Set();

          analysisData.forEach((item) => {
              const signature = computeProgramSignature(item);
              const programKey = String(item.program_id);
              validProgramIds.add(programKey);
              const cached = cache[programKey];
              if (cached && cached.signature === signature && cached.result) {
                  cacheUpdates[programKey] = {
                      loading: false,
                      error: '',
                      result: cached.result,
                      items: Array.isArray(cached.items) ? cached.items : [],
                      cached: true,
                      signature,
                  };
              } else if (cached && cached.signature !== signature) {
                  delete cache[programKey];
                  cacheMutated = true;
              }
          });

          if (cacheMutated) {
              writeAiCache(cache);
          }

          setAiStates((prev) => {
              const next = { ...prev };

              Object.keys(next).forEach((key) => {
                  const entry = next[key];
                  if (!validProgramIds.has(key) && entry?.cached) {
                      delete next[key];
                      return;
                  }

                  if (validProgramIds.has(key)) {
                      const update = cacheUpdates[key];
                      if (update) {
                          if (!entry || entry.cached || (!entry.result && !entry.loading)) {
                              next[key] = { ...update };
                          }
                      } else if (entry?.cached) {
                          delete next[key];
                      }
                  }
              });

              Object.entries(cacheUpdates).forEach(([key, value]) => {
                  if (!next[key]) {
                      next[key] = { ...value };
                  }
              });

              return next;
          });

      }, [analysisData]);

      const getStatusVariant = (status) => ({ 'At Risk': 'danger', 'Needs Attention': 'warning', 'On Track': 'success', 'Completed': 'success' }[status] || 'secondary');
      const getStatusClass = (status) => ({
          'At Risk': 'status-chip at-risk',
          'Needs Attention': 'status-chip needs-attention',
          'On Track': 'status-chip on-track',
          'Completed': 'status-chip completed',
      }[status] || 'status-chip');

      const currentProgramMeta = activeProgramId ? analysisData.find((item) => item.program_id === activeProgramId) : null;
    const currentAiState = activeProgramId ? aiStates[activeProgramId] || {} : {};
    const currentAiItems = Array.isArray(currentAiState.items) ? currentAiState.items : [];
      const programDisplayName = currentProgramMeta
          ? (currentProgramMeta.program_code ? `${currentProgramMeta.program_code} • ${currentProgramMeta.program_name}` : currentProgramMeta.program_name)
          : 'Selected Program';

      const handleAnalyzeWithAI = async (programId, signatureOverride) => {
          const programMeta = signatureOverride ? null : analysisData.find((item) => item.program_id === programId);
          const signature = signatureOverride ?? computeProgramSignature(programMeta);
          setAiStates((prev) => {
              const previous = prev[programId] || {};
              return {
                  ...prev,
                  [programId]: {
                      ...previous,
                      loading: true,
                      error: '',
                      cached: previous.cached ?? false,
                      signature,
                      result: typeof previous.result === 'string' ? previous.result : '',
                      items: Array.isArray(previous.items) ? previous.items : [],
                  },
              };
          });

          try {
              const response = await apiFetch('/api/gap-analysis/analyze', {
                  method: 'POST',
                  body: JSON.stringify({ program_id: programId }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data?.message || 'Failed to analyze program.');
              const analysisText = typeof data?.analysis === 'string' ? data.analysis : JSON.stringify(data?.analysis, null, 2);
              const normalizedText = analysisText || 'The AI did not return any recommendations for this request.';
              const structuredItems = Array.isArray(data?.items) ? data.items : [];
              if (signature) {
                  upsertAiCacheEntry(programId, { signature, result: normalizedText, items: structuredItems });
              } else {
                  removeAiCacheEntry(programId);
              }
              setAiStates((prev) => ({
                  ...prev,
                  [programId]: {
                      loading: false,
                      error: '',
                      result: normalizedText,
                      items: structuredItems,
                      cached: false,
                      signature,
                  },
              }));
          } catch (err) {
              setAiStates((prev) => ({
                  ...prev,
                  [programId]: {
                      ...(prev[programId] || {}),
                      loading: false,
                      error: err.message || 'Failed to analyze program.',
                      result: prev[programId]?.result || '',
                      items: Array.isArray(prev[programId]?.items) ? prev[programId].items : [],
                      signature,
                  },
              }));
          }
      };

      const handleOpenAiModal = (programId) => {
          if (!programId) return;
          const programMeta = analysisData.find((item) => item.program_id === programId);
          const signature = computeProgramSignature(programMeta);
          const aiState = aiStates[programId];

          setActiveProgramId(programId);
          setShowAiModal(true);

          if (!aiState?.result || aiState.signature !== signature || aiState.error) {
              handleAnalyzeWithAI(programId, signature);
          }
      };

      const handleCloseAiModal = () => {
          setShowAiModal(false);
          setActiveProgramId(null);
      };

      return (
          <div className="content-card">
              <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                      <h1 className="mb-1">Compliance Dashboard</h1>
                      <p className="text-muted mb-0">Track accreditation readiness across programs and unlock AI insights to close gaps faster.</p>
                  </div>
              </div>
              {isLoading ? (
                  <div className="text-center p-5"><Spinner animation="border" /></div>
              ) : error ? (
                  <Alert variant="danger">{error}</Alert>
              ) : analysisData.length === 0 ? (
                  <div className="text-center text-muted py-5">No compliance data is available yet. Start uploading documents to see live analytics.</div>
              ) : (
                  <Row className="g-4">
                      {analysisData.map((item) => {
                          const effectiveStatus = (Number(item.compliance_percentage) >= 100) ? 'Completed' : item.predicted_status;
                          const aiState = aiStates[item.program_id] || { loading: false, error: '', result: '' };
                          return (
                              <Col md={6} xl={4} key={item.program_id}>
                                  <Card className="compliance-card h-100">
                                      <Card.Header className="d-flex justify-content-between align-items-center">
                                          <span>{item.program_code || item.program_name}</span>
                                          <span className={getStatusClass(effectiveStatus)}>
                                              {effectiveStatus === 'Completed' && (
                                                  <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
                                              )}
                                              <span className="visually-hidden">Status: </span>
                                              {effectiveStatus}
                                          </span>
                                      </Card.Header>
                                      <Card.Body>
                                          <div className="compliance-metric">
                                              <div className="compliance-percentage">{item.compliance_percentage}%</div>
                                              <div className="compliance-subtitle">Compliant</div>
                                          </div>
                                          <ProgressBar
                                              className={`compliance-progress ${Number(item.compliance_percentage) >= 100 ? 'completed' : ''}`}
                                              variant={getStatusVariant(effectiveStatus)}
                                              now={item.compliance_percentage}
                                              animated={Number(item.compliance_percentage) < 100}
                                          />
                                          <div className="compliance-summary text-center">{item.compliant_criteria} of {item.total_criteria} criteria met.</div>
                                          <Button
                                              type="button"
                                              className="compliance-ai-button mt-2"
                                              onClick={() => handleOpenAiModal(item.program_id)}
                                              disabled={aiState.loading}
                                          >
                                              {aiState.loading ? (
                                                  <><Spinner as="span" animation="border" size="sm" className="me-2" />Analyzing…</>
                                              ) : (
                                                  <><i className="bi bi-robot me-2"></i>View AI Insights</>
                                              )}
                                          </Button>
                                          {aiState.error && (
                                              <Alert variant="warning" className="mt-3 mb-0">
                                                  {aiState.error}
                                              </Alert>
                                          )}
                                      </Card.Body>
                                  </Card>
                              </Col>
                          );
                      })}
                  </Row>
              )}
              <Modal show={showAiModal} onHide={handleCloseAiModal} size="lg" centered scrollable>
                  <Modal.Header closeButton>
                      <Modal.Title>Compliance Insights — {programDisplayName}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                      <div className="mb-4">
                          <h5 className="mb-3">AI Recommendations</h5>
                          {currentAiState.loading ? (
                              <div className="text-center py-3"><Spinner animation="border" /></div>
                          ) : currentAiState.error ? (
                              <Alert variant="warning">{currentAiState.error}</Alert>
                          ) : currentAiState.result ? (
                              <div
                                  className="ai-modal-text"
                                  style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}
                              >
                                  {currentAiState.result}
                              </div>
                          ) : (
                              <div className="text-muted">Run the AI analysis to generate recommendations.</div>
                          )}
                      </div>
                      <div>
                          <h5 className="mb-3">AI Gap Breakdown</h5>
                          {currentAiState.loading ? (
                              <div className="text-center py-3"><Spinner animation="border" /></div>
                          ) : currentAiState.error ? (
                              <Alert variant="danger">Re-run the analysis to view structured gap details.</Alert>
                          ) : currentAiItems.length ? (
                              <div className="table-responsive">
                                  <Table striped bordered hover responsive size="sm" className="mb-0">
                                      <thead>
                                          <tr>
                                              <th>Criterion</th>
                                              <th>Description</th>
                                              <th>Required Document</th>
                                              <th>Suggested Action</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {currentAiItems.map((missing, index) => (
                                              <tr key={missing.id ?? `${activeProgramId}-${index}`}>
                                                  <td>{missing.criterion_code || '—'}</td>
                                                  <td>{missing.description || '—'}</td>
                                                  <td>{missing.document_needed || '—'}</td>
                                                  <td>{missing.remediation_suggestion || 'Upload the required document to fulfill this criterion.'}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </Table>
                              </div>
                          ) : (
                              <div className="text-muted">No structured gap details were returned. Review the summary above for insights.</div>
                          )}
                      </div>
                  </Modal.Body>
                  <Modal.Footer>
                      <Button
                          variant="primary"
                          onClick={() => handleAnalyzeWithAI(activeProgramId)}
                          disabled={!activeProgramId || currentAiState.loading}
                          style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}
                      >
                          {currentAiState.loading ? (
                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                          ) : (
                              <i className="bi bi-arrow-repeat me-2"></i>
                          )}
                          Re-run Analysis
                      </Button>
                      <Button variant="secondary" onClick={handleCloseAiModal}>Close</Button>
                  </Modal.Footer>
              </Modal>
          </div>
      );
  }
  
function SarOverviewPage({ onOpenEditor }) {
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [sars, setSars] = useState([]);
    const [cycle, setCycle] = useState('AY 2025');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch('/api/programs');
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to load programs');
                setPrograms(Array.isArray(data) ? data : []);
                if (data.length) setSelectedProgramId(String(data[0].id));
            } catch (e) {
                setError(e.message);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadSars = async () => {
            if (!selectedProgramId) return;
            setLoading(true);
            try {
                const res = await apiFetch(`/api/programs/${selectedProgramId}/sars`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to load SARs');
                setSars(Array.isArray(data) ? data : []);
                setError('');
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadSars();
    }, [selectedProgramId]);

    const normalize = (v) => (v || '').toString().trim().toLowerCase();
    const existingSar = sars.find(s => normalize(s.cycle) === normalize(cycle));

    const handleCreateOrOpen = async () => {
        if (!selectedProgramId) return;
        // If SAR already exists for this cycle, just open it
        if (existingSar) {
            onOpenEditor?.(existingSar.id);
            return;
        }
        setLoading(true);
        try {
            const res = await apiFetch(`/api/programs/${selectedProgramId}/sars`, { method: 'POST', body: JSON.stringify({ cycle }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Failed to create SAR');
            setSars(prev => [data, ...prev]);
            onOpenEditor?.(data.id);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="mb-1">Self-Assessment Report</h1>
                    <small className="text-muted">Create and manage SARs per program and cycle.</small>
                </div>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row className="g-3 align-items-end mb-3">
                <Col md={5}>
                    <Form.Group>
                        <Form.Label>Program</Form.Label>
                        <Form.Select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} • ${p.name}` : p.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Cycle</Form.Label>
                        <Form.Control value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="e.g., AY 2025" />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Button className="w-100" onClick={handleCreateOrOpen} disabled={loading} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : (existingSar ? 'Open SAR' : 'Create SAR')}
                    </Button>
                </Col>
            </Row>
            <div className="table-responsive">
                <Table hover size="sm" className="align-middle">
                    <thead><tr><th>Cycle</th><th>Status</th><th>Sections</th><th>Created</th><th></th></tr></thead>
                    <tbody>
                        {sars.map(s => (
                            <tr key={s.id}>
                                <td>{s.cycle}</td>
                                <td>
                                    <Badge
                                        bg={(() => {
                                            const key = String(s.status || '').toLowerCase();
                                            if (key === 'approved' || key === 'completed') return 'success';
                                            if (key === 'in_review' || key === 'pending' || key === 'submitted') return 'info';
                                            if (key === 'returned' || key === 'needs_revision' || key === 'rejected') return 'danger';
                                            if (key === 'draft') return 'secondary';
                                            return 'dark';
                                        })()}
                                        className="text-uppercase"
                                    >
                                        {String(s.status || 'UNKNOWN').replace(/_/g, ' ')}
                                    </Badge>
                                </td>
                                <td>{s.sections_count ?? (Array.isArray(s.sections) ? s.sections.length : 9)}</td>
                                <td>{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</td>
                                <td className="text-end">
                                    <Button size="sm" variant="primary" className="me-2" onClick={() => onOpenEditor?.(s.id)}><i className="bi bi-pencil-square me-1"></i>Edit</Button>
                                    {['draft','returned'].includes(String(s.status || '').toLowerCase()) && (
                                        <Button size="sm" variant="danger" onClick={async()=>{
                                            const confirmed = await window.Swal.fire({ title: 'Delete this SAR?', text: 'This action cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete' });
                                            if (!confirmed.isConfirmed) return;
                                            try {
                                                const res = await apiFetch(`/api/sars/${s.id}`, { method: 'DELETE' });
                                                if (!res.ok) {
                                                    const body = await res.json().catch(()=>({}));
                                                    throw new Error(body?.message || 'Failed to delete SAR');
                                                }
                                                setSars(prev => prev.filter(x => x.id !== s.id));
                                                notify.toast({ icon: 'success', title: 'Deleted' });
                                            } catch (e) { notify.error('Delete failed', e.message); }
                                        }}>Delete</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sars.length === 0 && !loading && (
                            <tr><td colSpan={5} className="text-center text-muted py-3">No SARs yet for this program.</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

function SarEditorPage({ sarId, onBack, currentUser, initialSection = null }) {
    const [sar, setSar] = useState(null);
    const [activeSection, setActiveSection] = useState(1);
    const [saving, setSaving] = useState(false); // manual save
    const [autoSaving, setAutoSaving] = useState(false); // autosave flag
    const [savedAt, setSavedAt] = useState(null); // Date | null
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');
    const [comments, setComments] = useState([]);
    const [evidence, setEvidence] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [docPicker, setDocPicker] = useState({ show: false, search: '', items: [], loading: false, error: '' });
    const [sectionReviewers, setSectionReviewers] = useState([]);
    const [history, setHistory] = useState([]);
    const [sarExporting, setSarExporting] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const saveTimerRef = useRef(null);
    const lastSavedHashRef = useRef('');
    const lastToastAtRef = useRef(0);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch(`/api/sars/${sarId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to load SAR');
                setSar(data);
                if (initialSection && Number.isFinite(Number(initialSection))) {
                    setActiveSection(Number(initialSection));
                }
                // Load SAR-level reviewers
                try {
                    const rv = await engagementService.sarListReviewers(sarId);
                    setReviewers(Array.isArray(rv) ? rv : []);
                } catch (_) { /* ignore */ }
            } catch (e) {
                setError(e.message);
            }
        };
        load();
        // React to SSE notifications for realtime refresh within SAR editor
        const onNotify = (ev) => {
            try {
                const n = JSON.parse(ev.data || '{}');
                if (n?.type === 'sar') {
                    // If link references this SAR id, refresh current section data
                    const linkSarId = (()=>{ try { const m = (n.link||'').match(/\/sar\/(\d+)/); return m ? parseInt(m[1]) : null; } catch { return null; } })();
                    if (linkSarId && Number(linkSarId) === Number(sarId)) {
                        // Re-fetch current section data (comments/evidence/ratings/reviewers/history)
                        const sec = (sar?.sections||[]).find(s => Number(s.section_no) === Number(activeSection));
                        if (!sec) return;
                        (async()=>{
                            try {
                                const [cm, evd, rts, rvr, hist] = await Promise.allSettled([
                                    engagementService.getComments(sec.id, 'sar-section'),
                                    engagementService.sarListEvidence(sec.id),
                                    engagementService.sarListRatings(sec.id),
                                    engagementService.sarListSectionReviewers(sec.id),
                                    (async()=>{ const res = await apiFetch(`/api/sar-sections/${sec.id}/history`); return res.ok ? res.json() : []; })(),
                                ]);
                                if (cm.status === 'fulfilled') setComments(Array.isArray(cm.value)? cm.value: []);
                                if (evd.status === 'fulfilled') setEvidence(Array.isArray(evd.value)? evd.value: []);
                                if (rts.status === 'fulfilled') setRatings(Array.isArray(rts.value)? rts.value: []);
                                if (rvr.status === 'fulfilled') setSectionReviewers(Array.isArray(rvr.value)? rvr.value: []);
                                if (hist.status === 'fulfilled') setHistory(Array.isArray(hist.value)? hist.value: []);
                                // Also refresh SAR-level reviewers list
                                try { const rv = await engagementService.sarListReviewers(sarId); setReviewers(Array.isArray(rv) ? rv : []); } catch {}
                            } catch {}
                        })();
                    }
                }
            } catch {}
        };
        // Attach listener to the shared EventSource the app sets up
        try {
            if (window.__appEventSource) {
                window.__appEventSource.addEventListener('notification', onNotify);
            } else {
                // As a fallback, patch the global handler to capture messages
                document.addEventListener('sse:notification', (e) => onNotify({ data: JSON.stringify(e.detail || {}) }));
            }
        } catch {}
        return () => {
            try { if (window.__appEventSource) window.__appEventSource.removeEventListener('notification', onNotify); } catch {}
        };
    }, [sarId]);

    const openDocPicker = async () => {
        if (!sar?.program_id) { notify.warning('Missing program context', 'Open this SAR from a program.'); return; }
        setDocPicker(prev => ({ ...prev, show: true, loading: true, error: '' }));
        try {
            const res = await apiFetch(`/api/programs/${sar.program_id}/documents`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Failed to load documents');
            setDocPicker(prev => ({ ...prev, items: Array.isArray(data)? data: [], loading: false }));
        } catch (e) {
            setDocPicker(prev => ({ ...prev, error: e.message, loading: false }));
        }
    };

    // Load comments for active section when SAR/section is ready
    useEffect(() => {
        const fetchComments = async () => {
            if (!sar) return;
            const sec = sar.sections?.find(s => Number(s.section_no) === Number(activeSection));
            if (!sec) return;
            setCommentsLoading(true);
            try {
                const data = await engagementService.getComments(sec.id, 'sar-section');
                setComments(Array.isArray(data) ? data : []);
                // Parallel fetch evidence and ratings
                const [ev, rt, rv, hist] = await Promise.allSettled([
                    engagementService.sarListEvidence(sec.id),
                    engagementService.sarListRatings(sec.id),
                    engagementService.sarListSectionReviewers(sec.id),
                    (async()=>{
                        try {
                            const res = await apiFetch(`/api/sar-sections/${sec.id}/history`);
                            if (!res.ok) return [];
                            return await res.json();
                        } catch { return []; }
                    })()
                ]);
                if (ev.status === 'fulfilled') setEvidence(ev.value);
                if (rt.status === 'fulfilled') setRatings(rt.value);
                if (rv.status === 'fulfilled') setSectionReviewers(Array.isArray(rv.value) ? rv.value : []);
                if (hist.status === 'fulfilled') setHistory(Array.isArray(hist.value) ? hist.value : []);
            } catch (e) {
                // keep quiet; show error banner only for core editor errors
                console.warn('Failed to load comments:', e);
            } finally {
                setCommentsLoading(false);
            }
        };
        fetchComments();
    }, [sar, activeSection]);

    const section = sar?.sections?.find(s => Number(s.section_no) === Number(activeSection));
    const content = (section?.content) || {};
    const contentHash = useMemo(() => {
        try { return JSON.stringify(content || {}); } catch { return ''; }
    }, [content]);

    const handleChange = (key, value) => {
        const updated = { ...content, [key]: value };
        setSar(prev => ({ ...prev, sections: prev.sections.map(sec => (sec.section_no === activeSection ? { ...sec, content: updated } : sec)) }));
        setIsDirty(true);
    };

    // Initialize lastSavedHash and savedAt when SAR/section changes
    useEffect(() => {
        lastSavedHashRef.current = contentHash;
        if (section?.updated_at) {
            try { setSavedAt(new Date(section.updated_at)); } catch { /* noop */ }
        } else {
            // Unknown last saved time for this section
            setSavedAt(null);
        }
        setIsDirty(false);
        if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    }, [sar?.id, activeSection]);

    // Shared save function (used by manual save and autosave)
    const saveSection = async (trigger = 'manual') => {
        if (!sar) return;
        const isAuto = trigger === 'auto';
        if (!isAuto) setSaving(true); else setAutoSaving(true);
        try {
            const res = await apiFetch(`/api/sars/${sar.id}/sections/${activeSection}`, { method: 'PUT', body: JSON.stringify({ content }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Failed to save');
            // Update local state with server copy
            setSar(prev => ({ ...prev, sections: prev.sections.map(sec => (sec.section_no === activeSection ? data : sec)) }));
            lastSavedHashRef.current = JSON.stringify(data?.content || {});
            setSavedAt(new Date());
            setIsDirty(false);
            // Throttle toasts to avoid spamming on autosave (10s window)
            const now = Date.now();
            const shouldToast = !isAuto || (now - lastToastAtRef.current > 10000);
            if (shouldToast) {
                notify.toast({ icon: 'success', title: 'Saved', text: `Section ${activeSection} saved` });
                lastToastAtRef.current = now;
            }
        } catch (e) {
            setError(e.message);
        } finally {
            if (!isAuto) setSaving(false); else setAutoSaving(false);
        }
    };

    const handleSave = async () => {
        await saveSection('manual');
    };

    const handleSarExportPdf = useCallback(async () => {
        if (!sar?.id) return;
        try {
            setSarExporting(true);
            const response = await apiFetch(`/api/sars/${sar.id}/export/pdf`, {
                headers: {
                    Accept: 'application/pdf',
                },
            });

            if (!response.ok) {
                let message = `Request failed (${response.status})`;
                try {
                    const body = await response.json();
                    if (body?.message) message = body.message;
                } catch { /* ignore JSON parse errors */ }
                throw new Error(message);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const popup = window.open(url, '_blank');
            if (!popup) {
                notify.error('Export blocked', 'Allow pop-ups to view the PDF, or download manually.');
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (err) {
            notify.error('Export failed', err?.message || 'Unable to export SAR');
        } finally {
            setSarExporting(false);
        }
    }, [sar?.id]);

    // Debounced autosave on content changes when dirty
    useEffect(() => {
        if (!sar || !isDirty) return;
        if (lastSavedHashRef.current === contentHash) return; // no effective change
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveSection('auto');
        }, 1200);
        return () => { if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; } };
    }, [contentHash, isDirty, sar?.id, activeSection]);

    return (
        <div className="content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <Button variant="link" className="p-0 me-2" onClick={onBack}><i className="bi bi-arrow-left"></i> Back</Button>
                    <h1 className="d-inline-block mb-0 ms-2">Edit SAR — {sar?.cycle || '...'}</h1>
                </div>
                <div className="text-end">
                    <Badge bg="secondary" className="text-uppercase">{sar?.status || 'Draft'}</Badge>
                    <div className="small text-muted mt-1">
                        {autoSaving || saving ? (
                            <span><i className="bi bi-cloud-upload me-1"></i>Saving…</span>
                        ) : savedAt ? (
                            <span><i className="bi bi-check2 me-1"></i>Last saved at {savedAt.toLocaleTimeString()}</span>
                        ) : (
                            <span>Not saved yet</span>
                        )}
                    </div>
                    {/* Workflow controls */}
                    <div className="mt-2 d-flex gap-2 justify-content-end">
                        {sar?.status === 'draft' && (hasRole(currentUser, ['admin','program_coordinator'])) && (
                            <Button size="sm" variant="primary" onClick={async ()=>{
                                const res = await apiFetch(`/api/sars/${sar.id}/submit`, { method: 'POST' });
                                const data = await res.json();
                                if (!res.ok) { setError(data?.message||'Failed to submit'); return; }
                                setSar(data); notify.toast({ icon:'success', title:'Submitted for review' });
                            }}>Submit for Review</Button>
                        )}
                        {sar?.status === 'in_review' && hasRole(currentUser, ['admin']) && (
                            <>
                                <Button size="sm" variant="success" onClick={async ()=>{
                                    const res = await apiFetch(`/api/sars/${sar.id}/approve`, { method: 'POST' });
                                    const data = await res.json();
                                    if (!res.ok) { setError(data?.message||'Failed to approve'); return; }
                                    setSar(data); notify.toast({ icon:'success', title:'SAR approved' });
                                }}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={async ()=>{
                                    const { value: remarks } = await window.Swal.fire({
                                        title: 'Return SAR', input: 'textarea', inputLabel: 'Remarks', inputPlaceholder: 'Provide reasons or requested changes...', showCancelButton: true
                                    });
                                    if (!remarks) return;
                                    const res = await apiFetch(`/api/sars/${sar.id}/return`, { method: 'POST', body: JSON.stringify({ remarks }) });
                                    const data = await res.json();
                                    if (!res.ok) { setError(data?.message||'Failed to return'); return; }
                                    setSar(data); notify.toast({ icon:'info', title:'SAR returned', text:'Remarks sent to coordinators' });
                                }}>Return</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            {!sar ? (
                <div className="text-center p-4"><Spinner animation="border" /></div>
            ) : (
                <Row className="g-3">
                    <Col md={3}>
                        <ListGroup>
                            {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                                <ListGroup.Item key={n} action active={n === activeSection} onClick={() => setActiveSection(n)}>
                                    Section {n}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Col>
                    <Col md={9}>
                        <Card className="mb-3">
                            <Card.Header>Section {activeSection} Narrative</Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Overview</Form.Label>
                                    <Form.Control as="textarea" rows={5} value={content.overview || ''} onChange={(e) => handleChange('overview', e.target.value)} readOnly={!hasRole(currentUser, ['admin','program_coordinator'])} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Strengths</Form.Label>
                                    <Form.Control as="textarea" rows={4} value={content.strengths || ''} onChange={(e) => handleChange('strengths', e.target.value)} readOnly={!hasRole(currentUser, ['admin','program_coordinator'])} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Areas for Improvement</Form.Label>
                                    <Form.Control as="textarea" rows={4} value={content.gaps || ''} onChange={(e) => handleChange('gaps', e.target.value)} readOnly={!hasRole(currentUser, ['admin','program_coordinator'])} />
                                </Form.Group>
                                <div className="d-flex justify-content-between align-items-center">
                                    <Form.Group className="mb-0">
                                        <Form.Label className="me-2 mb-0">Section status</Form.Label>
                                        <Form.Select
                                            size="sm"
                                            style={{ width: 220, display: 'inline-block' }}
                        value={section?.status || 'draft'}
                        disabled={!hasRole(currentUser, ['admin','program_coordinator'])}
                        onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                                const res = await apiFetch(`/api/sars/${sar.id}/sections/${activeSection}`, { method: 'PUT', body: JSON.stringify({ status: newStatus, content }) });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data?.message || 'Failed to update status');
                                setSar(prev => ({ ...prev, sections: prev.sections.map(sec => (sec.section_no === activeSection ? data : sec)) }));
                                notify.toast({ icon: 'success', title: 'Status updated', text: `Section ${activeSection} set to ${newStatus.replaceAll('_',' ')}` });
                            } catch (e) {
                                setError(e.message);
                            }
                        }}
                    >
                                            <option value="draft">Draft</option>
                                            <option value="ready_for_review" disabled={!hasRole(currentUser, ['admin','program_coordinator'])}>Ready for review</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <div className="text-end">
                                        <Button onClick={handleSave} disabled={saving || !hasRole(currentUser, ['admin','program_coordinator'])} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                                            {saving ? <Spinner as="span" animation="border" size="sm" /> : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <Row className="g-3">
                            <Col md={6}>
                                <Card>
                                    <Card.Header>Evidence</Card.Header>
                                    <Card.Body>
                                        {evidence.length === 0 ? (
                                            <div className="text-muted">No evidence linked to this section yet.</div>
                                        ) : (
                                            <ListGroup variant="flush">
                                                {evidence.map(doc => (
                                                    <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                                                        <span>{doc.name || doc.original_name || `Document #${doc.id}`}</span>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        )}
                                        {hasRole(currentUser, ['admin','program_coordinator']) && (
                                            <div className="mt-2">
                                                <Button size="sm" variant="primary" onClick={openDocPicker}>
                                                    <i className="bi bi-link-45deg me-1"></i> Attach Evidence
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header>Scoring</Card.Header>
                                    <Card.Body>
                                        {ratings.length === 0 ? (
                                            <div className="text-muted mb-2">No ratings yet.</div>
                                        ) : (
                                            <ListGroup className="mb-2" variant="flush">
                                                {ratings.map(r => (
                                                    <ListGroup.Item key={r.id}>
                                                        <strong>{r.user?.name || 'Reviewer'}</strong>: {r.score} {r.remarks ? `— ${r.remarks}` : ''}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        )}
                                        {hasRole(currentUser, ['admin']) && (
                                            <div className="d-flex gap-2 align-items-center">
                                                <Form.Select size="sm" id="score-select" defaultValue="3" style={{ width: 90 }}>
                                                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                                </Form.Select>
                                                <Form.Control size="sm" placeholder="Remarks (optional)" id="score-remarks" />
                                                <Button size="sm" onClick={async()=>{
                                                    try {
                                                        const score = parseInt(document.getElementById('score-select').value);
                                                        const remarks = document.getElementById('score-remarks').value;
                                                        const sec = sar.sections?.find(s => Number(s.section_no) === Number(activeSection));
                                                        if (!sec) return;
                                                        const r = await engagementService.sarUpsertRating(sec.id, score, remarks);
                                                        setRatings(prev => {
                                                            const idx = prev.findIndex(x => x.user?.id === r.user?.id);
                                                            if (idx >= 0) { const copy = prev.slice(); copy[idx] = r; return copy; }
                                                            return [r, ...prev];
                                                        });
                                                        notify.toast({ icon:'success', title:'Rating saved' });
                                                    } catch (e) { notify.error('Rating failed', e.message); }
                                                }}>Save</Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        <Card>
                            <Card.Header>Comments</Card.Header>
                            <Card.Body>
                                <CommentThread
                                    entityType="sar-section"
                                    entityId={section?.id}
                                    comments={comments}
                                    loading={commentsLoading}
                                    onCommentAdded={(c) => setComments(prev => [c, ...prev])}
                                />
                            </Card.Body>
                        </Card>
                        <Card className="mt-3">
                            <Card.Header>Reviewers & Export</Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <div className="fw-semibold">Assigned Reviewers</div>
                                        <div className="text-muted small">At SAR level</div>
                                    </div>
                                    {hasRole(currentUser, ['admin']) && (
                                        <Button size="sm" variant="primary" onClick={async()=>{
                                            try {
                                                const admins = await engagementService.listAdmins();
                                                if (!admins || admins.length === 0) { notify.error('No admins found', 'Create an admin user first.'); return; }
                                                const inputOptions = admins.reduce((acc,u)=>{ acc[u.id] = `${u.name} (${u.email})`; return acc; }, {});
                                                const { value: userId } = await window.Swal.fire({ title:'Assign Reviewer', input:'select', inputOptions, inputPlaceholder:'Select admin', showCancelButton:true });
                                                if (!userId || !sar?.id) return;
                                                const a = await engagementService.sarAssignReviewerToSar(sar.id, parseInt(userId));
                                                setReviewers(prev => [a, ...prev]);
                                                notify.toast({ icon:'success', title:'Reviewer assigned' });
                                            } catch (e) { notify.error('Assign failed', e.message); }
                                        }}>Assign</Button>
                                    )}
                                </div>
                                {reviewers.length === 0 ? (
                                    <div className="text-muted">No reviewers assigned.</div>
                                ) : (
                                    <ListGroup variant="flush" className="mb-2">
                                        {reviewers.map(r => (
                                            <ListGroup.Item key={r.id} className="d-flex justify-content-between">
                                                <span>{r.user?.name || `User #${r.user_id}`}{r.due_date ? ` • due ${r.due_date}` : ''}</span>
                                                {hasRole(currentUser, ['admin']) && (
                                                    <Button size="sm" variant="danger" onClick={async()=>{
                                                        try { await engagementService.sarRemoveAssignment(r.id); setReviewers(prev => prev.filter(x => x.id !== r.id)); notify.toast({ icon:'success', title:'Removed' }); }
                                                        catch (e) { notify.error('Remove failed', e.message); }
                                                    }}>Remove</Button>
                                                )}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                                <hr />
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <div className="fw-semibold">Section Reviewers</div>
                                        <div className="text-muted small">For Section {activeSection}</div>
                                    </div>
                                    {hasRole(currentUser, ['admin']) && (
                                        <Button size="sm" variant="primary" onClick={async()=>{
                                            try {
                                                const admins = await engagementService.listAdmins();
                                                if (!admins || admins.length === 0) { notify.error('No admins found', 'Create an admin user first.'); return; }
                                                const inputOptions = admins.reduce((acc,u)=>{ acc[u.id] = `${u.name} (${u.email})`; return acc; }, {});
                                                const { value: userId } = await window.Swal.fire({ title:'Assign Section Reviewer', input:'select', inputOptions, inputPlaceholder:'Select admin', showCancelButton:true });
                                                if (!userId) return;
                                                const { value: dueDate } = await window.Swal.fire({ title:'Due Date (optional)', input:'date', inputLabel:'Due date', showCancelButton:true });
                                                const { value: role } = await window.Swal.fire({ title:'Role (optional)', input:'text', inputLabel:'Role label', inputPlaceholder:'e.g., Internal Accreditor', showCancelButton:true });
                                                const sec = sar.sections?.find(s => Number(s.section_no) === Number(activeSection));
                                                if (!sec) return;
                                                const a = await engagementService.sarAssignReviewerToSection(sec.id, parseInt(userId), dueDate || null, role || null);
                                                setSectionReviewers(prev => [a, ...prev]);
                                                notify.toast({ icon:'success', title:'Section reviewer assigned' });
                                            } catch (e) { notify.error('Assign failed', e.message); }
                                        }}>Assign</Button>
                                    )}
                                </div>
                                {sectionReviewers.length === 0 ? (
                                    <div className="text-muted">No section reviewers yet.</div>
                                ) : (
                                    <ListGroup variant="flush" className="mb-2">
                                        {sectionReviewers.map(r => (
                                            <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="fw-semibold">{r.user?.name || `User #${r.user_id}`}</span>
                                                    {r.role && <Badge bg="info" className="ms-2">{r.role}</Badge>}
                                                    {r.due_date && <span className="text-muted small ms-2">due {r.due_date}</span>}
                                                </div>
                                                {hasRole(currentUser, ['admin']) && (
                                                    <Button size="sm" variant="danger" onClick={async()=>{
                                                        try { await engagementService.sarRemoveAssignment(r.id); setSectionReviewers(prev => prev.filter(x => x.id !== r.id)); notify.toast({ icon:'success', title:'Removed' }); }
                                                        catch (e) { notify.error('Remove failed', e.message); }
                                                    }}>Remove</Button>
                                                )}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                                <div className="mt-2">
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        disabled={!sar?.id || sarExporting}
                                        onClick={handleSarExportPdf}
                                    >
                                        {sarExporting ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Generating PDF…
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-filetype-pdf me-1"></i>
                                                Export (PDF)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                        <Card className="mt-3">
                            <Card.Header>History</Card.Header>
                            <Card.Body>
                                {history.length === 0 ? (
                                    <div className="text-muted">No changes recorded yet for this section.</div>
                                ) : (
                                    <ListGroup variant="flush">
                                        {history.map(h => (
                                            <ListGroup.Item key={h.id} className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-semibold">{new Date(h.created_at).toLocaleString()}</div>
                                                    <div className="text-muted small">by {h.user?.name || 'Unknown'} • status: {h.status || 'draft'}</div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" variant="secondary" onClick={()=>{
                                                        const details = [
                                                            `Overview: ${h.content?.overview || ''}`,
                                                            `Strengths: ${h.content?.strengths || ''}`,
                                                            `Areas: ${h.content?.gaps || ''}`
                                                        ].join('\n\n');
                                                        window.Swal.fire({ title: 'Snapshot', html: `<pre style="text-align:left;white-space:pre-wrap">${details.replace(/[&<>]/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))}</pre>`, width: 700 });
                                                    }}>View</Button>
                                                    {hasRole(currentUser, ['admin','task_force_chair','program_coordinator']) && (
                                                        <Button size="sm" variant="primary" onClick={async()=>{
                                                            const confirmed = await window.Swal.fire({ title: 'Restore this version?', icon:'warning', showCancelButton:true, confirmButtonText:'Restore' });
                                                            if (!confirmed.isConfirmed) return;
                                                            try {
                                                                const res = await apiFetch(`/api/sars/${sar.id}/sections/${activeSection}`, { method: 'PUT', body: JSON.stringify({ content: h.content, status: h.status }) });
                                                                const data = await res.json();
                                                                if (!res.ok) throw new Error(data?.message || 'Restore failed');
                                                                setSar(prev => ({ ...prev, sections: prev.sections.map(sec => (sec.section_no === activeSection ? data : sec)) }));
                                                                notify.toast({ icon:'success', title:'Restored' });
                                                            } catch (e) { notify.error('Restore failed', e.message); }
                                                        }}>Restore</Button>
                                                    )}
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            {/* Document Picker Modal */}
            <DocumentPickerModal
                show={docPicker.show}
                onHide={() => setDocPicker(prev => ({ ...prev, show: false }))}
                loading={docPicker.loading}
                error={docPicker.error}
                items={(function(){
                    // Prefer documents from the same section; fallback to all
                    const sameSection = (docPicker.items||[]).filter(d => String(d.section||'') === String(activeSection));
                    return sameSection.length > 0 ? sameSection : (docPicker.items||[]);
                })()}
                onAttach={async (doc) => {
                    try {
                        setDocPicker(prev => ({ ...prev, loading: true }));
                        const sec = sar?.sections?.find(s => Number(s.section_no) === Number(activeSection));
                        if (!sec) throw new Error('Section not found');
                        const updated = await engagementService.sarAttachEvidence(sec.id, parseInt(doc.id));
                        setEvidence(Array.isArray(updated) ? updated : [doc, ...evidence]);
                        setDocPicker(prev => ({ ...prev, show: false, loading: false }));
                        notify.toast({ icon:'success', title:'Evidence attached' });
                    } catch (e) {
                        setDocPicker(prev => ({ ...prev, loading: false }));
                        notify.error('Attach failed', e.message);
                    }
                }}
            />
        </div>
    );
}

// Modal: Document Picker
function DocumentPickerModal({ show, onHide, items = [], loading = false, error = '', onAttach }) {
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return items;
        return items.filter(d => (d.name||'').toLowerCase().includes(needle) || (d.original_name||'').toLowerCase().includes(needle));
    }, [q, items]);
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Select Document</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control placeholder="Search by name" className="mb-3" value={q} onChange={(e)=>setQ(e.target.value)} />
                {loading ? <div className="text-center p-4"><Spinner animation="border"/></div> : error ? <Alert variant="danger">{error}</Alert> : (
                    <ListGroup style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                        {filtered.map(doc => (
                            <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-semibold">{doc.name || doc.original_name || `Document #${doc.id}`}</div>
                                    <div className="text-muted small">Section {doc.section || '—'} • Status: {String(doc.status || '').replaceAll('_',' ')}</div>
                                </div>
                                <Button size="sm" onClick={()=>onAttach?.(doc)}>Attach</Button>
                            </ListGroup.Item>
                        ))}
                        {filtered.length === 0 && <div className="text-muted text-center p-3">No documents match your search.</div>}
                    </ListGroup>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

  function ProgramManagementPage({ onManageDocuments, onManageActionPlans, isAdmin }) {
      const [programs, setPrograms] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
            const [isSaving, setIsSaving] = useState(false);
            const [error, setError] = useState('');
            const [searchTerm, setSearchTerm] = useState('');
            const filteredPrograms = useMemo(() => {
                const query = searchTerm.trim().toLowerCase();
                if (!query) return programs;
                return programs.filter((p) => {
                    const code = (p.code || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const level = (p.accreditation_level || '').toLowerCase();
                    return code.includes(query) || name.includes(query) || level.includes(query);
                });
            }, [programs, searchTerm]);
    const [showModal, setShowModal] = useState(false);
    const [currentProgram, setCurrentProgram] = useState({ id: null, code: '', name: '', accreditation_level: 'Candidate', status: 'Active' });
      const fetchPrograms = async (showLoader = true) => {
        if(showLoader) setIsLoading(true);
        try {
            const response = await apiFetch('/api/programs');
            if (!response.ok) throw new Error('Failed to fetch programs.');
            const data = await response.json();
            setPrograms(data);
        } catch (err) { setError(err.message); } finally { if(showLoader) setIsLoading(false); }
    };
      useEffect(() => { fetchPrograms(); }, []);
      const handleShowModal = (program = null) => {
        setCurrentProgram(program ? { ...program } : { id: null, code: '', name: '', accreditation_level: 'Candidate', status: 'Active' });
        setShowModal(true);
    };
      const handleCloseModal = () => setShowModal(false);
      const handleSaveProgram = async () => {
        setIsSaving(true);
        const url = currentProgram.id ? `/api/programs/${currentProgram.id}` : '/api/programs';
        const method = currentProgram.id ? 'PUT' : 'POST';
        try {
            const response = await apiFetch(url, { method, body: JSON.stringify(currentProgram) });
            if (!response.ok) throw new Error('Failed to save program.');
            fetchPrograms(false); // Refresh list without full loader
            handleCloseModal();
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
      const handleToggleProgramStatus = async (program) => {
        const nextStatus = program.status === 'Active' ? 'Inactive' : 'Active';
        try {
            const response = await apiFetch(`/api/programs/${program.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: nextStatus })
            });
            if (!response.ok) throw new Error('Failed to update program status.');
            fetchPrograms(false);
        } catch (err) {
            notify.error('Update failed', err.message);
        }
    };
      return (<div className="content-card">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <h1 className="mb-0">Program Management</h1>
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 w-100 w-md-auto">
                  <Form.Control
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search programs..."
                      style={{ maxWidth: '260px' }}
                  />
                  {isAdmin && <Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-plus-circle me-2"></i> Add Program</Button>}
              </div>
          </div>
          {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : error ? <Alert variant="danger">{error}</Alert> :
              <Table striped bordered hover responsive><thead><tr><th>ID</th><th>Code</th><th>Program Name</th><th>Accreditation Level</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>{filteredPrograms.length === 0 ? <tr><td colSpan={6} className="text-center text-muted">No programs found.</td></tr> : filteredPrograms.map(p => <tr key={p.id}><td>{p.id}</td><td>{p.code}</td><td>{p.name}</td><td>{p.accreditation_level}</td><td>{p.status}</td><td>
                      {isAdmin && <Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(p)}><i className="bi bi-pencil-square"></i> Edit</Button>}
                      {isAdmin && <Button variant={p.status === 'Active' ? 'danger' : 'success'} size="sm" className="me-2" onClick={() => handleToggleProgramStatus(p)}>
                          <i className={`bi ${p.status === 'Active' ? 'bi-slash-circle' : 'bi-check-circle'}`}></i> {p.status === 'Active' ? 'Disable' : 'Enable'}
                      </Button>}
                      <Button variant="info" size="sm" className="me-2" onClick={() => onManageDocuments(p)}><i className="bi bi-folder"></i> Docs</Button>
                      {isAdmin && <Button variant="success" size="sm" onClick={() => onManageActionPlans(p)}><i className="bi bi-clipboard-check"></i> Plans</Button>}
                  </td></tr>)}
                  </tbody>
              </Table>}
          <Modal show={showModal} onHide={handleCloseModal}><Modal.Header closeButton><Modal.Title>{currentProgram.id ? 'Edit Program' : 'Add New Program'}</Modal.Title></Modal.Header><Modal.Body><Form>
              <Form.Group className="mb-3"><Form.Label>Program Code</Form.Label><Form.Control type="text" defaultValue={currentProgram.code} onChange={(e) => setCurrentProgram({ ...currentProgram, code: e.target.value })} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Program Full Name</Form.Label><Form.Control type="text" defaultValue={currentProgram.name} onChange={(e) => setCurrentProgram({ ...currentProgram, name: e.target.value })} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Accreditation Level</Form.Label><Form.Select defaultValue={currentProgram.accreditation_level} onChange={(e) => setCurrentProgram({ ...currentProgram, accreditation_level: e.target.value })}><option value="Candidate">Candidate</option><option value="Level 1">Level 1</option><option value="Level 2">Level 2</option><option value="Level 3">Level 3</option></Form.Select></Form.Group>
          </Form></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button><Button variant="primary" onClick={handleSaveProgram} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}</Button></Modal.Footer></Modal>
      </div>);
  }
  
    function DocumentManagementPage({ program, onBack, isAdmin, canReview = false, backLabel = 'Back to Programs', onProgramChange, currentUser }) {
          const [programs, setPrograms] = useState([]);
          const [currentProgram, setCurrentProgram] = useState(program);
          const [documents, setDocuments] = useState([]);
          const [isLoading, setIsLoading] = useState(true);
          const [isUploading, setIsUploading] = useState(false);
          const [error, setError] = useState('');
          const [selectedFile, setSelectedFile] = useState(null);
          const [selectedSection, setSelectedSection] = useState('1');
          const [subSectionsBySection, setSubSectionsBySection] = useState({});
          const [selectedSubSection, setSelectedSubSection] = useState('');
          const [approvingDocumentId, setApprovingDocumentId] = useState(null);
          const [preview, setPreview] = useState({ show: false, title: '', url: '' });
          const [coordinators, setCoordinators] = useState([]);
          const [isLoadingCoordinators, setIsLoadingCoordinators] = useState(false);
          const [commentModal, setCommentModal] = useState({ show: false, section: null });
          const [commentBody, setCommentBody] = useState('');
          const [commentRecipients, setCommentRecipients] = useState([]);
          const [sectionComments, setSectionComments] = useState([]);
          const [isLoadingSectionComments, setIsLoadingSectionComments] = useState(false);
          const [isSubmittingComment, setIsSubmittingComment] = useState(false);
          const [commentError, setCommentError] = useState('');
          const [rejectingDocumentId, setRejectingDocumentId] = useState(null);
          const [coordinatorCommentMap, setCoordinatorCommentMap] = useState({});
          const fileInputRef = useRef(null);

          const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
          const isCoordinatorView = !isAdmin && hasRole(currentUser, ['program_coordinator']);

          useEffect(() => {
              setCurrentProgram(program);
          }, [program]);

          useEffect(() => {
              const loadPrograms = async () => {
                  try {
                      const response = await apiFetch('/api/programs');
                      if (!response.ok) throw new Error('Failed to fetch programs.');
                      const data = await response.json();
                      setPrograms(data);
                      if (!program && data.length > 0) {
                          setCurrentProgram(data[0]);
                          onProgramChange?.(data[0]);
                      }
                  } catch (err) {
                      console.error('Failed to load programs', err);
                  }
              };
              loadPrograms();
          }, []);

          const fetchDocuments = async (targetProgram) => {
              if (!targetProgram) return;
              setIsLoading(true);
              try {
                  const response = await apiFetch(`/api/programs/${targetProgram.id}/documents`);
                  if (!response.ok) throw new Error('Failed to fetch documents.');
                  const data = await response.json();
                  setDocuments(data);
                  setError('');
              } catch (err) {
                  setError(err.message);
              } finally {
                  setIsLoading(false);
              }
          };

          const fetchSubSections = async (targetProgram) => {
              if (!targetProgram) return;
              try {
                  const response = await apiFetch(`/api/programs/${targetProgram.id}/compliance-matrix`);
                  if (!response.ok) throw new Error('Failed to fetch accreditation criteria.');
                  const data = await response.json();
                  const grouped = data.reduce((acc, item) => {
                      const sectionKey = String(item.section ?? '');
                      if (!sectionKey) return acc;
                      acc[sectionKey] = acc[sectionKey] || [];
                      acc[sectionKey].push({
                          id: String(item.id),
                          code: item.criterion_code,
                          label: `${item.criterion_code} • ${item.description}`,
                          documentName: item.document_needed || item.description,
                      });
                      return acc;
                  }, {});
                  Object.values(grouped).forEach((list) => list.sort((a, b) => a.code.localeCompare(b.code)));
                  setSubSectionsBySection(grouped);
              } catch (err) {
                  console.error('Failed to load accreditation subsections', err);
                  setSubSectionsBySection({});
              }
          };

          const fetchCoordinators = async (targetProgram) => {
              if (!targetProgram) return;
              setIsLoadingCoordinators(true);
              try {
                  const response = await apiFetch(`/api/programs/${targetProgram.id}/coordinators`);
                  if (!response.ok) throw new Error('Failed to fetch coordinators.');
                  const data = await response.json();
                  setCoordinators(Array.isArray(data) ? data : []);
              } catch (err) {
                  console.error('Failed to load coordinators', err);
                  setCoordinators([]);
              } finally {
                  setIsLoadingCoordinators(false);
              }
          };

          const fetchCoordinatorSectionComments = async (targetProgram) => {
              if (!targetProgram || !isCoordinatorView || !currentUserId) {
                  setCoordinatorCommentMap({});
                  return;
              }
              try {
                  const response = await apiFetch(`/api/programs/${targetProgram.id}/section-comments`);
                  if (!response.ok) throw new Error('Failed to fetch section comments.');
                  const data = await response.json();
                  const filtered = Array.isArray(data)
                      ? data.filter((comment) => Number(comment.coordinator_id) === currentUserId)
                      : [];
                  const grouped = filtered.reduce((acc, comment) => {
                      const sectionKey = Number(comment.section);
                      if (!sectionKey) return acc;
                      acc[sectionKey] = acc[sectionKey] || [];
                      acc[sectionKey].push(comment);
                      return acc;
                  }, {});
                  Object.values(grouped).forEach((list) => list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
                  setCoordinatorCommentMap(grouped);
              } catch (err) {
                  console.error('Failed to load coordinator section comments', err);
                  setCoordinatorCommentMap({});
              }
          };

          const loadSectionComments = async (sectionNumber) => {
              if (!currentProgram) return;
              setIsLoadingSectionComments(true);
              try {
                  const response = await apiFetch(`/api/programs/${currentProgram.id}/section-comments?section=${sectionNumber}`);
                  if (!response.ok) throw new Error('Failed to fetch section comments.');
                  const data = await response.json();
                  const normalized = Array.isArray(data) ? data : [];
                  const relevant = isAdmin ? normalized : normalized.filter((comment) => Number(comment.coordinator_id) === currentUserId);
                  relevant.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                  setSectionComments(relevant);
              } catch (err) {
                  console.error('Failed to load section comments', err);
                  setSectionComments([]);
              } finally {
                  setIsLoadingSectionComments(false);
              }
          };

          const openCommentModal = (sectionNumber) => {
              if (!currentProgram) return;
              setCommentModal({ show: true, section: sectionNumber });
              setCommentBody('');
              setCommentError('');
              if (isAdmin) {
                  setCommentRecipients(coordinators.map((coord) => String(coord.id)));
              } else {
                  setCommentRecipients([]);
              }
              loadSectionComments(sectionNumber);
          };

          const closeCommentModal = () => {
              setCommentModal({ show: false, section: null });
              setCommentBody('');
              setCommentRecipients([]);
              setSectionComments([]);
              setCommentError('');
          };

          const handleRecipientToggle = (value, checked) => {
              if (!isAdmin) return;
              setCommentRecipients((prev) => {
                  if (checked) {
                      const next = new Set(prev.concat(value));
                      return Array.from(next);
                  }
                  return prev.filter((id) => id !== value);
              });
          };

          const handleToggleAllRecipients = (checked) => {
              if (!isAdmin) return;
              if (checked) {
                  setCommentRecipients(coordinators.map((coord) => String(coord.id)));
              } else {
                  setCommentRecipients([]);
              }
          };

          const handleSubmitComment = async () => {
              if (!isAdmin) return;
              if (!currentProgram || !commentModal.section) return;
              const trimmed = commentBody.trim();
              if (!trimmed) {
                  setCommentError('Please enter a comment.');
                  return;
              }
              if (commentRecipients.length === 0) {
                  setCommentError('Select at least one coordinator.');
                  return;
              }
              setCommentError('');
              setIsSubmittingComment(true);
              try {
                  const response = await apiFetch(`/api/programs/${currentProgram.id}/section-comments`, {
                      method: 'POST',
                      body: JSON.stringify({
                          section: commentModal.section,
                          coordinator_ids: commentRecipients.map((id) => Number(id)),
                          comment: trimmed,
                      }),
                  });
                  let payload = null;
                  try {
                      payload = await response.json();
                  } catch (_) {
                      payload = null;
                  }
                  if (!response.ok) {
                      const message = payload?.message || 'Failed to send comment.';
                      throw new Error(message);
                  }
                  notify.success('Comment sent', 'Coordinators will be notified about this section.');
                  setCommentBody('');
                  await loadSectionComments(commentModal.section);
                  await fetchCoordinatorSectionComments(currentProgram);
              } catch (err) {
                  const message = err.message || 'Failed to send comment.';
                  setCommentError(message);
                  notify.error('Send failed', message);
              } finally {
                  setIsSubmittingComment(false);
              }
          };

          useEffect(() => {
              if (!currentProgram) return;
              fetchDocuments(currentProgram);
              fetchSubSections(currentProgram);
          }, [currentProgram]);

          useEffect(() => {
              if (!currentProgram) return;
              fetchCoordinators(currentProgram);
          }, [currentProgram]);

          useEffect(() => {
              if (!currentProgram) return;
              if (!isCoordinatorView || !currentUserId) {
                  setCoordinatorCommentMap({});
                  return;
              }
              fetchCoordinatorSectionComments(currentProgram);
          }, [currentProgram, isCoordinatorView, currentUserId]);

        // Live refresh when document-related notifications are received (from SSE/Echo)
        useEffect(() => {
            const onDocsChanged = () => {
                if (currentProgram) {
                    fetchDocuments(currentProgram);
                }
            };
            window.addEventListener('documents:changed', onDocsChanged);
            return () => window.removeEventListener('documents:changed', onDocsChanged);
        }, [currentProgram]);

          useEffect(() => {
              const options = subSectionsBySection[selectedSection] || [];
              if (options.length === 0) {
                  setSelectedSubSection('');
                  return;
              }
              if (!options.find((opt) => opt.id === selectedSubSection)) {
                  setSelectedSubSection(options[0].id);
              }
          }, [selectedSection, subSectionsBySection]);

          const handleFileChange = (e) => {
              const file = e.target.files?.[0];
              if (file) {
                  const allowedTypes = [
                      'application/pdf',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  ];
                  const allowedExts = ['.pdf', '.doc', '.docx'];
                  const name = file.name.toLowerCase();
                  const valid = allowedTypes.includes(file.type) || allowedExts.some(ext => name.endsWith(ext));
                  if (!valid) {
                      notify.warning('Invalid file', 'Only PDF, DOC, and DOCX files are allowed.');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      setSelectedFile(null);
                      return;
                  }
              }
              setSelectedFile(file || null);
          };

          const handleProgramSwitch = (event) => {
              const selectedId = event.target.value;
              const nextProgram = programs.find((p) => String(p.id) === selectedId);
              if (!nextProgram) return;
              setCurrentProgram(nextProgram);
              onProgramChange?.(nextProgram);
          };

          const handleSectionChange = (event) => {
              setSelectedSection(event.target.value);
          };

          const handleSubSectionChange = (event) => {
              setSelectedSubSection(event.target.value);
          };

          const handleUpload = async () => {
              if (!selectedFile || !currentProgram) return;
              setIsUploading(true);
              const formData = new FormData();
              const sectionOptions = subSectionsBySection[selectedSection] || [];
              const selectedMeta = sectionOptions.find((opt) => opt.id === selectedSubSection);
              formData.append('document', selectedFile);
              formData.append('section', selectedSection);
              if (selectedMeta?.documentName) {
                  formData.append('document_name', selectedMeta.documentName);
              }
              try {
                  const response = await apiFetch(`/api/programs/${currentProgram.id}/documents`, { method: 'POST', body: formData, headers: {} });
                  if (!response.ok) {
                      let message = 'Upload failed.';
                      try {
                          const errorBody = await response.json();
                          if (errorBody?.message) message = errorBody.message;
                          if (errorBody?.errors) {
                              message = Object.values(errorBody.errors).flat().join(' ');
                          }
                      } catch (_) {
                          // ignore parsing errors
                      }
                      throw new Error(message);
                  }
                  fetchDocuments(currentProgram);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                  }
              } catch (err) {
                  notify.error('Upload failed', err.message || 'An error occurred while uploading.');
              } finally {
                  setIsUploading(false);
              }
          };

          const handleReject = async (docId) => {
              if (!currentProgram) return;
              const confirmed = await notify.confirm({ text: 'Reject this document? Coordinators will be notified.' });
              if (!confirmed) return;
              setRejectingDocumentId(docId);
              try {
                  const response = await apiFetch(`/api/documents/${docId}/reject`, { method: 'POST' });
                  let payload = null;
                  try {
                      payload = await response.json();
                  } catch (_) {
                      payload = null;
                  }
                  if (!response.ok) {
                      const message = payload?.message || 'Failed to reject document.';
                      throw new Error(message);
                  }
                  await fetchDocuments(currentProgram);
                  notify.toast({ icon: 'info', title: 'Document rejected' });
              } catch (err) {
                  notify.error('Reject failed', err.message || 'Failed to reject document.');
              } finally {
                  setRejectingDocumentId(null);
              }
          };

          const handleMarkCompliant = async (docId) => {
              setApprovingDocumentId(docId);
              try {
                  const response = await apiFetch(`/api/documents/${docId}/approve`, { method: 'POST' });
                  const data = await response.json();
                  if (!response.ok) {
                      throw new Error(data?.message || 'Failed to update status.');
                  }
                  await fetchDocuments(currentProgram);
              } catch (err) {
                  notify.error('Update failed', err.message || 'Failed to update status.');
              } finally {
                  setApprovingDocumentId(null);
              }
          };

          const groupedDocuments = documents.reduce((acc, doc) => {
              (acc[doc.section] = acc[doc.section] || []).push(doc);
              return acc;
          }, {});

          const availableSubSections = subSectionsBySection[selectedSection] || [];

          return (
              <div>
                  <Button variant="light" onClick={onBack} className="mb-4"><i className="bi bi-arrow-left"></i> {backLabel}</Button>
                  <div className="content-card">
                      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                          <div>
                              <h1 className="mb-1">Document Repository for: {currentProgram?.code || currentProgram?.name || 'Select a Program'}</h1>
                              {currentProgram?.name && currentProgram?.code && currentProgram.code !== currentProgram.name && (
                                  <div className="text-muted fw-medium">{currentProgram.name}</div>
                              )}
                              <p className="text-muted mb-0">Manage accreditation documents for each of the 9 required sections.</p>
                          </div>
                          <div style={{ minWidth: '260px' }}>
                              <Form.Group className="mb-0">
                                  <Form.Label className="text-muted small">Switch Program</Form.Label>
                                  <Form.Select value={currentProgram?.id ? String(currentProgram.id) : ''} onChange={handleProgramSwitch}>
                                      <option value="" disabled>Select a program...</option>
                                      {programs.map((p) => (
                                          <option key={p.id} value={p.id}>{p.code ? `${p.code} • ${p.name}` : p.name}</option>
                                      ))}
                                  </Form.Select>
                              </Form.Group>
                          </div>
                      </div>

                      <Card className="mb-4">
                          <Card.Header as="h5">Upload New Document</Card.Header>
                          <Card.Body>
                              <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm={3} md={2}>Accreditation Section</Form.Label>
                                  <Col sm={9} md={10}>
                                      <Form.Select value={selectedSection} onChange={handleSectionChange}>
                                          {[...Array(9)].map((_, i) => (
                                              <option key={i + 1} value={i + 1}>Section {i + 1}</option>
                                          ))}
                                      </Form.Select>
                                  </Col>
                              </Form.Group>
                              <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm={3} md={2}>Sub Section</Form.Label>
                                  <Col sm={9} md={10}>
                                      <Form.Select value={selectedSubSection} onChange={handleSubSectionChange} disabled={availableSubSections.length === 0}>
                                          {availableSubSections.length === 0 ? (
                                              <option value="">No subsections available</option>
                                          ) : (
                                              availableSubSections.map((sub) => (
                                                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                                              ))
                                          )}
                                      </Form.Select>
                                      {availableSubSections.length === 0 && (
                                          <Form.Text muted>No additional criteria found for this section.</Form.Text>
                                      )}
                                  </Col>
                              </Form.Group>
                              <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm={3} md={2}>Select File</Form.Label>
                                  <Col sm={9} md={10}>
                                      <Form.Control
                                          type="file"
                                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                          onChange={handleFileChange}
                                          ref={fileInputRef}
                                      />
                                      <Form.Text muted>Accepted formats: PDF, DOC, DOCX (max 20MB).</Form.Text>
                                  </Col>
                              </Form.Group>
                              <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !currentProgram} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                                  {isUploading ? <Spinner as="span" size="sm" /> : <><i className="bi bi-upload me-2"></i>Upload Document</>}
                              </Button>
                          </Card.Body>
                      </Card>

                      {isLoading ? (
                          <div className="text-center p-5"><Spinner animation="border" /></div>
                      ) : error ? (
                          <Alert variant="danger">{error}</Alert>
                      ) : (
                          <Row>
                              {[...Array(9)].map((_, i) => {
                                  const sectionNumber = i + 1;
                                  const coordinatorNotes = isCoordinatorView ? (coordinatorCommentMap[sectionNumber] || []) : [];
                                  const latestCoordinatorNote = coordinatorNotes[0];
                                  const notePreview = latestCoordinatorNote?.comment || '';
                                  const previewText = notePreview && notePreview.length > 180 ? `${notePreview.slice(0, 177)}...` : notePreview;
                                  const latestAuthor = latestCoordinatorNote?.author?.name || 'Admin';
                                  const latestDate = latestCoordinatorNote?.created_at ? new Date(latestCoordinatorNote.created_at).toLocaleString() : null;
                                  return (
                                      <Col md={6} lg={4} key={sectionNumber} className="mb-4">
                                          <Card>
                                              <Card.Header>Section {sectionNumber}</Card.Header>
                                              {isCoordinatorView && coordinatorNotes.length > 0 && (
                                                  <div className="px-3 py-3 border-bottom bg-light">
                                                      <div className="d-flex flex-column gap-2">
                                                          <div className="d-flex justify-content-between align-items-start gap-3">
                                                              <div>
                                                                  <div className="fw-semibold text-primary d-flex align-items-center gap-2">
                                                                      <i className="bi bi-chat-dots-fill"></i>
                                                                      Admin Notes
                                                                  </div>
                                                                  {latestDate && (
                                                                      <div className="small text-muted">Latest from {latestAuthor} • {latestDate}</div>
                                                                  )}
                                                              </div>
                                                              <Button variant="outline-primary" size="sm" onClick={() => openCommentModal(sectionNumber)}>
                                                                  View Notes ({coordinatorNotes.length})
                                                              </Button>
                                                          </div>
                                                          {previewText && (
                                                              <div className="small text-dark" style={{ whiteSpace: 'pre-wrap' }}>{previewText}</div>
                                                          )}
                                                      </div>
                                                  </div>
                                              )}
                                              <ListGroup variant="flush">
                                                  {groupedDocuments[sectionNumber] ? groupedDocuments[sectionNumber].map((doc) => {
                                                  const fileUrl = buildStorageUrl(doc?.path);
                                                  const filename = doc?.name || doc?.original_name || (doc?.path ? doc.path.split('/').pop() : `Document ${doc?.id ?? ''}`);
                                                  const statusMeta = getDocumentStatusMeta(doc?.status);
                                                  const updatedAt = doc?.updated_at || doc?.created_at;
                                                  const uploaderName = doc?.uploader?.name || doc?.uploader?.email || '—';
                                                  const isApproved = String(doc?.status || '').toLowerCase() === 'approved';
                                                  const openPreview = async () => {
                                                      if (doc?.id) {
                                                          try {
                                                              const res = await apiFetch(`/api/documents/${doc.id}/signed-url`);
                                                              if (res.ok) {
                                                                  const data = await res.json();
                                                                  setPreview({ show: true, title: filename, url: data.url, originalPath: doc?.path || '' });
                                                                  return;
                                                              }
                                                          } catch (_) { /* ignore */ }
                                                      }
                                                      setPreview({ show: true, title: filename, url: fileUrl, originalPath: doc?.path || '' });
                                                  };
                                                  return (
                                                      <ListGroup.Item key={doc.id} className="py-3">
                                                          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                                                              <div>
                                                                  <div className="fw-semibold">
                                                                      <button type="button" className="btn btn-link p-0 align-baseline" onClick={openPreview} disabled={!fileUrl}>
                                                                          {filename}
                                                                      </button>
                                                                  </div>
                                                                  <div className="text-muted small">
                                                                      Uploaded by {uploaderName}
                                                                      {updatedAt && ` • Updated ${new Date(updatedAt).toLocaleString()}`}
                                                                  </div>
                                                                  {doc?.description && <div className="text-muted small">{doc.description}</div>}
                                                              </div>
                                                              <div className="d-flex flex-wrap align-items-center gap-2 justify-content-start justify-content-lg-end w-100">
                                                                  <Badge bg={statusMeta.variant}>{statusMeta.label}</Badge>
                                                                  {fileUrl && (
                                                                      <Button variant="secondary" size="sm" onClick={openPreview}>
                                                                          View
                                                                      </Button>
                                                                  )}
                                                                  {fileUrl && (
                                                                      <Button as="a" variant="primary" size="sm" href={fileUrl} target="_blank" rel="noopener noreferrer" title="Download file">
                                                                          Download
                                                                      </Button>
                                                                  )}
                                                                  {canReview && !isApproved && (
                                                                      <Button
                                                                          variant="success"
                                                                          size="sm"
                                                                          onClick={() => handleMarkCompliant(doc.id)}
                                                                          disabled={approvingDocumentId === doc.id}
                                                                      >
                                                                          {approvingDocumentId === doc.id ? <Spinner as="span" animation="border" size="sm" /> : 'Mark Compliant'}
                                                                      </Button>
                                                                  )}
                                                                  {isAdmin && (
                                                                      <div className="d-flex flex-wrap align-items-center gap-2">
                                                                          <Button
                                                                              variant="outline-secondary"
                                                                              size="sm"
                                                                              onClick={() => openCommentModal(doc.section)}
                                                                          >
                                                                              <i className="bi bi-chat-left-text"></i> Comment
                                                                          </Button>
                                                                          <Button
                                                                              variant="danger"
                                                                              size="sm"
                                                                              onClick={() => handleReject(doc.id)}
                                                                              disabled={rejectingDocumentId === doc.id}
                                                                          >
                                                                              {rejectingDocumentId === doc.id ? (
                                                                                  <Spinner as="span" animation="border" size="sm" />
                                                                              ) : (
                                                                                  <>
                                                                                      <i className="bi bi-x-circle"></i> Reject
                                                                                  </>
                                                                              )}
                                                                          </Button>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          </div>
                                                      </ListGroup.Item>
                                                  );
                                              }) : <ListGroup.Item>No documents yet.</ListGroup.Item>}
                                              </ListGroup>
                                          </Card>
                                      </Col>
                                  );
                              })}
                          </Row>
                      )}
                      <DocumentViewerModal
                          show={preview.show}
                          onHide={() => setPreview({ show: false, title: '', url: '' })}
                          title={preview.title}
                          src={preview.url}
                          originalPath={preview.originalPath}
                      />
                      <Modal show={commentModal.show} onHide={closeCommentModal} size="lg" centered>
                          <Modal.Header closeButton>
                              <Modal.Title>Section {commentModal.section} Comments</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                              {isAdmin ? (
                                  <>
                                      <Form.Group className="mb-3">
                                          <Form.Label>Comment for Coordinators</Form.Label>
                                          <Form.Control
                                              as="textarea"
                                              rows={3}
                                              value={commentBody}
                                              onChange={(e) => setCommentBody(e.target.value)}
                                              placeholder="Enter your comment for the selected coordinators..."
                                              disabled={isSubmittingComment}
                                          />
                                      </Form.Group>
                                      <Form.Group className="mb-3">
                                          <Form.Label>Recipients</Form.Label>
                                          <div className="mb-2">
                                              <Form.Check
                                                  type="checkbox"
                                                  id="all-coords"
                                                  label="All Coordinators"
                                                  checked={commentRecipients.length === coordinators.length && coordinators.length > 0}
                                                  onChange={(e) => handleToggleAllRecipients(e.target.checked)}
                                                  disabled={isSubmittingComment || isLoadingCoordinators}
                                              />
                                          </div>
                                          <div className="d-flex flex-wrap gap-2">
                                              {isLoadingCoordinators ? (
                                                  <Spinner animation="border" size="sm" />
                                              ) : coordinators.length === 0 ? (
                                                  <span className="text-muted">No coordinators assigned.</span>
                                              ) : (
                                                  coordinators.map((coord) => (
                                                      <Form.Check
                                                          key={coord.id}
                                                          type="checkbox"
                                                          id={`coord-${coord.id}`}
                                                          label={coord.name}
                                                          checked={commentRecipients.includes(String(coord.id))}
                                                          onChange={(e) => handleRecipientToggle(String(coord.id), e.target.checked)}
                                                          disabled={isSubmittingComment}
                                                      />
                                                  ))
                                              )}
                                          </div>
                                      </Form.Group>
                                      {commentError && <Alert variant="danger">{commentError}</Alert>}
                                      <div className="d-flex justify-content-end">
                                          <Button
                                              variant="primary"
                                              onClick={handleSubmitComment}
                                              disabled={isSubmittingComment || !commentBody.trim() || commentRecipients.length === 0}
                                          >
                                              {isSubmittingComment ? (
                                                  <Spinner as="span" size="sm" />
                                              ) : (
                                                  <>
                                                      <i className="bi bi-send me-2"></i>
                                                      Send Comment
                                                  </>
                                              )}
                                          </Button>
                                      </div>
                                      <hr />
                                  </>
                              ) : (
                                  <Alert variant="info" className="mb-3">
                                      These notes were shared by administrators for your section. Reach out to them if you have questions or need clarification.
                                  </Alert>
                              )}
                              <h6 className="mb-3">{isAdmin ? 'Previous Comments' : 'Notes for You'}</h6>
                              {isLoadingSectionComments ? (
                                  <div className="text-center text-muted py-3">
                                      <Spinner animation="border" size="sm" /> Loading comments...
                                  </div>
                              ) : sectionComments.length === 0 ? (
                                  <div className="text-muted">No comments for this section yet.</div>
                              ) : (
                                  <ListGroup variant="flush">
                                      {sectionComments.map((c) => (
                                          <ListGroup.Item key={c.id} className="px-0 py-2">
                                              <div className="d-flex align-items-start">
                                                  <div className="flex-shrink-0 me-2">
                                                      <i className="bi bi-person-circle fs-4 text-secondary"></i>
                                                  </div>
                                                  <div className="flex-grow-1">
                                                      <div className="d-flex justify-content-between align-items-center mb-1">
                                                          <span className="fw-semibold">{c.author?.name || 'Admin'}</span>
                                                          <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
                                                      </div>
                                                      <div className="mb-1">
                                                          <span className="badge bg-secondary">
                                                              To: {c.coordinator?.name || 'Coordinator'}
                                                          </span>
                                                      </div>
                                                      <div style={{ whiteSpace: 'pre-wrap' }}>{c.comment}</div>
                                                  </div>
                                              </div>
                                          </ListGroup.Item>
                                      ))}
                                  </ListGroup>
                              )}
                          </Modal.Body>
                      </Modal>
                  </div>
              </div>
          );
      }
  
function ProfilePage({ user, onUserUpdate }) {
        const [formData, setFormData] = useState({ name: '', middle_name: '', last_name: '', suffix: '', personal_email: '', current_password: '', password: '', password_confirmation: '' });
        const [avatarFile, setAvatarFile] = useState(null);
        const [previewUrl, setPreviewUrl] = useState('');
        const [isSaving, setIsSaving] = useState(false);
        useEffect(() => { if (user) setFormData((prev) => ({ ...prev, name: user.name || '', middle_name: user.middle_name || '', last_name: user.last_name || '', suffix: user.suffix || '', personal_email: user.personal_email || '' })); setPreviewUrl(user?.avatar_url || ''); }, [user]);
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleFileChange = (e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                        const valid = ['image/jpeg','image/png','image/gif','image/webp'];
                        if (!valid.includes(file.type)) { notify.warning('Invalid image', 'Please select a valid image (JPG, PNG, GIF, WEBP).'); return; }
                        if (file.size > 5 * 1024 * 1024) { notify.warning('Image too large', 'Image must be 5MB or smaller.'); return; }
                        setAvatarFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                } else {
                        setAvatarFile(null);
                }
        };
        const handleSaveChanges = async (e) => {
            e.preventDefault();
            setIsSaving(true);
            try {
                    const fd = new FormData();
                    ['name','middle_name','last_name','suffix','personal_email','current_password','password','password_confirmation'].forEach((k) => {
                            if (formData[k] !== undefined && formData[k] !== null) fd.append(k, formData[k]);
                    });
                      fd.append('_method', 'PUT');
                      if (avatarFile) fd.append('avatar', avatarFile);
                      const response = await apiFetch('/api/user', { method: 'POST', body: fd });
                    if (!response.ok) {
                            const err = await response.json().catch(() => ({}));
                            const msg = err?.message || (err?.errors ? Object.values(err.errors).flat().join(' ') : 'Failed to update profile.');
                            throw new Error(msg);
                    }
                    const updatedUser = await response.json();
            onUserUpdate(updatedUser);
            notify.success('Profile updated', 'Your changes have been saved.');
        } catch (err) { notify.error('Update failed', err.message); } finally { setIsSaving(false); }
    };
        return (
            <div className="content-card">
                <h1>My Profile</h1>
                <p>Update your personal information and account settings.</p>
                <Card>
                    <Card.Body>
                        <Form onSubmit={handleSaveChanges}>
                            <Row className="align-items-center mb-3">
                                <Col md="auto" className="text-center">
                                    <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '2px solid #eee', background: '#f8f9fa' }}>
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">No Photo</div>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                                        <Form.Text muted>JPG, PNG, GIF, WEBP up to 5MB</Form.Text>
                                    </div>
                                </Col>
                                <Col>
                                    <Row>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>First Name</Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required /></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Middle Name</Form.Label><Form.Control type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} /></Form.Group></Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Last Name</Form.Label><Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} /></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Suffix</Form.Label><Form.Control type="text" name="suffix" value={formData.suffix} onChange={handleChange} /></Form.Group></Col>
                                    </Row>
                                    <Form.Group className="mb-3"><Form.Label>Personal Email</Form.Label><Form.Control type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} /></Form.Group>
                                </Col>
                            </Row>
                            <hr />
                            <h5 className="mb-3">Change Password</h5>
                                                        <Row>
                                                                <Col md={4}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Current Password</Form.Label>
                                                                        <PasswordInput name="current_password" value={formData.current_password} onChange={handleChange} autoComplete="current-password" />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>New Password</Form.Label>
                                                                        <PasswordInput name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Confirm New Password</Form.Label>
                                                                        <PasswordInput name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} autoComplete="new-password" />
                                                                    </Form.Group>
                                                                </Col>
                                                        </Row>
                            <p className="text-muted">Your login email is: <strong>{user?.email}</strong>. It cannot be changed here.</p>
                            <Button type="submit" disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        );
}
  
  function ComplianceMatrixPage() {
      const [programs, setPrograms] = useState([]);
      const [selectedProgramId, setSelectedProgramId] = useState('');
    const [matrixData, setMatrixData] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState('');
            // New: section and subsection filters
            const [selectedSection, setSelectedSection] = useState('1');
            const [selectedSubSection, setSelectedSubSection] = useState('');
      useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await apiFetch('/api/programs');
                if (!response.ok) throw new Error('Failed to fetch programs.');
                const data = await response.json();
                setPrograms(data);
                if (data.length > 0) setSelectedProgramId(data[0].id);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchPrograms();
    }, []);
      useEffect(() => {
        if (!selectedProgramId) return;
        const fetchMatrix = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await apiFetch(`/api/programs/${selectedProgramId}/compliance-matrix`);
                if (!response.ok) throw new Error('Failed to fetch compliance matrix.');
                const data = await response.json();
                setMatrixData(data);
            } catch (err) {
                setMatrixData([]);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMatrix();
    }, [selectedProgramId]);
      const selectedProgram = programs.find((p) => String(p.id) === String(selectedProgramId));

      // Build available subsections from the matrix once loaded
      const subSectionsBySection = useMemo(() => {
          const grouped = matrixData.reduce((acc, item) => {
              const sectionKey = String(item.section ?? '');
              if (!sectionKey) return acc;
              acc[sectionKey] = acc[sectionKey] || [];
              acc[sectionKey].push({
                  id: String(item.id),
                  code: item.criterion_code,
                  label: `${item.criterion_code} • ${item.description}`,
              });
              return acc;
          }, {});
          // sort each list by code
          Object.values(grouped).forEach((list) => list.sort((a, b) => a.code.localeCompare(b.code)));
          return grouped;
      }, [matrixData]);

      // Ensure subsection selection stays valid when section/data changes
      useEffect(() => {
          const options = subSectionsBySection[String(selectedSection)] || [];
          if (options.length === 0) {
              setSelectedSubSection('');
              return;
          }
          if (!options.find((opt) => opt.id === selectedSubSection)) {
              // default to "All subsections" (empty) to show the whole section
              setSelectedSubSection('');
          }
      }, [selectedSection, subSectionsBySection]);

      const availableSubSections = subSectionsBySection[String(selectedSection)] || [];

      const filteredRows = useMemo(() => {
          return matrixData.filter((item) => {
              const inSection = String(item.section) === String(selectedSection);
              const inSub = !selectedSubSection || String(item.id) === String(selectedSubSection);
              return inSection && inSub;
          });
      }, [matrixData, selectedSection, selectedSubSection]);

      const handleSectionChange = (e) => setSelectedSection(e.target.value);
      const handleSubSectionChange = (e) => setSelectedSubSection(e.target.value);

      return (<div className="content-card"><h1>Compliance Matrix</h1><p>Select a program to view its compliance status against accreditation criteria.</p>
          <Form.Group className="mb-3"><Form.Label>Select Program</Form.Label><Form.Select value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)}>{programs.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} • ${p.name}` : p.name}</option>)}</Form.Select></Form.Group>
          {selectedProgram && selectedProgram.code && selectedProgram.name && selectedProgram.code !== selectedProgram.name && (
              <div className="mb-3 text-muted"><strong>{selectedProgram.code}</strong> &mdash; {selectedProgram.name}</div>
          )}

          {/* Section and Sub Section filters */}
          <Row className="g-3 mb-4">
              <Col md={4} sm={12}>
                  <Form.Group>
                      <Form.Label>Accreditation Section</Form.Label>
                      <Form.Select value={selectedSection} onChange={handleSectionChange}>
                          {[...Array(9)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>Section {i + 1}</option>
                          ))}
                      </Form.Select>
                  </Form.Group>
              </Col>
              <Col md={8} sm={12}>
                  <Form.Group>
                      <Form.Label>Sub Section</Form.Label>
                      <Form.Select value={selectedSubSection} onChange={handleSubSectionChange} disabled={availableSubSections.length === 0}>
                          <option value="">All subsections</option>
                          {availableSubSections.map((sub) => (
                              <option key={sub.id} value={sub.id}>{sub.label}</option>
                          ))}
                      </Form.Select>
                      {availableSubSections.length === 0 && (
                          <Form.Text muted>No subsections available for this section.</Form.Text>
                      )}
                  </Form.Group>
              </Col>
          </Row>

          {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : error ? <Alert variant="danger">{error}</Alert> :
              <Table striped bordered hover responsive>
                  <thead>
                      <tr>
                          <th>Criterion Code</th>
                          <th>Description</th>
                          <th>Document Needed</th>
                          <th>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredRows.map(item => {
                          const statusKeyRaw = String(item.status_code || item.status || 'missing').toLowerCase();
                          const statusMeta = getDocumentStatusMeta(statusKeyRaw);
                          const badgeLabel = item.status || statusMeta.label || 'Pending';
                          const badgeVariant = statusMeta.variant || (statusKeyRaw === 'compliant' ? 'success' : 'danger');
                          const rawUploadedAt = item.uploaded_at || item.latest_document_uploaded_at || item.document_uploaded_at || item.last_uploaded_at || null;
                          const uploadedLabel = rawUploadedAt ? new Date(rawUploadedAt).toLocaleString() : null;
                          return (
                              <tr key={item.id}>
                                  <td>{item.criterion_code}</td>
                                  <td>{item.description}</td>
                                  <td>{item.document_needed}</td>
                                  <td>
                                      <div className="d-flex align-items-center gap-2 flex-wrap">
                                          <Badge bg={badgeVariant}>{badgeLabel}</Badge>
                                          {uploadedLabel && (
                                              <span className="text-muted small">Uploaded {uploadedLabel}</span>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </Table>}
      </div>);
  }
  
  function UserManagementPage({ currentUser, onManageQualifications }) {
      const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [rbacRoles, setRbacRoles] = useState([]); // role names

    const coordinatorRoleNames = ['program_coordinator'];

            const handleRoleChange = (event) => {
                const value = event.target.value;
                const matchedRole = roles.find((role) => String(role.id) === String(value));
                const matchedRoleName = matchedRole?.name?.toLowerCase() || '';
                const isCoordinator = coordinatorRoleNames.includes(matchedRoleName);
                setCurrentUserData((prev) => ({
                        ...prev,
                        role_id: value,
                        coordinated_program_ids: isCoordinator ? (prev?.coordinated_program_ids || []) : [],
                }));
        };

                    const handleProgramSelectionChange = (event) => {
                        const selectedOptions = Array.from(event.target.selectedOptions || []);
                setCurrentUserData((prev) => ({
                        ...prev,
                        coordinated_program_ids: selectedOptions.map((option) => option.value),
                }));
        };

      const fetchUsersAndRoles = async () => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes, programsRes] = await Promise.all([
                apiFetch('/api/users'),
                apiFetch('/api/roles'),
                apiFetch('/api/programs'),
            ]);
            if (!usersRes.ok || !rolesRes.ok || !programsRes.ok) throw new Error('Failed to fetch data.');
            setUsers(await usersRes.json());
            setRoles(await rolesRes.json());
            setPrograms(await programsRes.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
  
              useEffect(() => { fetchUsersAndRoles(); }, []);
  
                    const sortedPrograms = React.useMemo(() => {
                        return [...programs].sort((a, b) => {
                                const labelA = a.code ? `${a.code}` : a.name;
                                const labelB = b.code ? `${b.code}` : b.name;
                                return labelA.localeCompare(labelB);
                        });
                    }, [programs]);

                    const selectedRole = currentUserData ? roles.find((role) => String(role.id) === String(currentUserData.role_id)) : null;
            const selectedRoleName = selectedRole?.name?.toLowerCase() || '';
            const isCoordinatorRoleSelected = coordinatorRoleNames.includes(selectedRoleName);
      const selectedCoordinatorPrograms = isCoordinatorRoleSelected && currentUserData
          ? sortedPrograms.filter((program) => (currentUserData.coordinated_program_ids || []).includes(String(program.id)))
          : [];

      const handleShowModal = (user = null) => {
        if (user) {
            setCurrentUserData({
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                role_id: user.role_id ? String(user.role_id) : (user.role?.id ? String(user.role.id) : ''),
                password: '',
                password_confirmation: '',
                coordinated_program_ids: Array.isArray(user.coordinated_programs) ? user.coordinated_programs.map((program) => String(program.id)) : [],
            });
        } else {
            setCurrentUserData({
                id: null,
                name: '',
                email: '',
                role_id: '',
                password: '',
                password_confirmation: '',
                coordinated_program_ids: [],
            });
        }
        setShowModal(true);
    };
  
      const handleCloseModal = () => setShowModal(false);
  
      const handleSaveUser = async () => {
        setIsSaving(true);
        const url = currentUserData.id ? `/api/users/${currentUserData.id}` : '/api/users';
        const method = currentUserData.id ? 'PUT' : 'POST';
        try {
            const payload = { ...currentUserData };
            if (!payload.password) delete payload.password;
            if (!payload.password_confirmation) delete payload.password_confirmation;
            if (Array.isArray(payload.coordinated_program_ids)) {
                payload.coordinated_program_ids = payload.coordinated_program_ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
            } else {
                delete payload.coordinated_program_ids;
            }
            const response = await apiFetch(url, { method, body: JSON.stringify(payload) });
            const data = await response.json();
            if (!response.ok) {
                if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
                throw new Error(data.message || 'Failed to save user.');
            }
            fetchUsersAndRoles();
            handleCloseModal();
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
  
      const handleDeleteUser = (userId) => {
        if (userId === currentUser.id) {
            notify.warning('Not allowed', 'You cannot delete your own account.');
            return;
        }
        notify.confirm({ text: 'This will permanently delete this user.' }).then((ok) => {
            if (!ok) return;
            apiFetch(`/api/users/${userId}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to delete user.');
                    fetchUsersAndRoles();
                    notify.toast({ icon: 'success', title: 'User deleted' });
                })
                .catch(err => notify.error('Delete failed', err.message));
        });
    };

            const handleSendBroadcast = async () => {
                if (!broadcastMessage.trim()) return notify.warning('Missing message', 'Please enter a message.');
                setIsBroadcasting(true);
                try {
                        let response;
                        if (Array.isArray(rbacRoles) && rbacRoles.length > 0) {
                            response = await apiFetch('/api/notifications/broadcast-roles', {
                                method: 'POST',
                                body: JSON.stringify({ message: broadcastMessage, roles: rbacRoles }),
                            });
                        } else {
                            response = await apiFetch('/api/notifications/broadcast', {
                                method: 'POST',
                                body: JSON.stringify({ message: broadcastMessage }),
                            });
                        }
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.message || 'Failed to send broadcast.');
                        notify.success('Broadcast sent', rbacRoles.length ? 'Your announcement was sent to selected roles.' : 'Your announcement was sent to all users.');
                        setBroadcastMessage('');
                        setRbacRoles([]);
                } catch (err) {
                        notify.error('Broadcast failed', err.message);
                } finally {
                        setIsBroadcasting(false);
                }
        };

      // --- OTP / 2FA toggle handling ---
      const [togglingUserId, setTogglingUserId] = useState(null);
      const handleToggleOtp = async (user) => {
        if (!user) return;
        const newValue = !user.google2fa_enabled;
        setTogglingUserId(user.id);
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, google2fa_enabled: newValue, _otpOptimistic: true } : u));
        try {
            const res = await apiFetch(`/api/admin/users/${user.id}/2fa`, {
              method: 'POST',
              body: JSON.stringify({ enable: newValue })
            });
            if (!res.ok) {
              throw new Error('Failed to update OTP status');
            }
            // Remove optimistic marker
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, _otpOptimistic: false } : u));
        } catch (e) {
            notify.error('Update failed', e.message);
            // Revert optimistic change
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, google2fa_enabled: !newValue, _otpOptimistic: false } : u));
        } finally {
            setTogglingUserId(null);
        }
      };

            // Small, reusable tag-style, searchable multi-select for roles
            function TagSelect({ options = [], value = [], onChange, placeholder = 'Select...', disabled = false }) {
                const [open, setOpen] = useState(false);
                const [query, setQuery] = useState('');
                const wrapperRef = useRef(null);
                const filtered = useMemo(() => {
                    const q = query.trim().toLowerCase();
                    if (!q) return options;
                    return options.filter(opt => (opt.label || '').toLowerCase().includes(q));
                }, [options, query]);
                useEffect(() => {
                    const onDocClick = (e) => {
                        if (!wrapperRef.current) return;
                        if (!wrapperRef.current.contains(e.target)) setOpen(false);
                    };
                    document.addEventListener('mousedown', onDocClick);
                    return () => document.removeEventListener('mousedown', onDocClick);
                }, []);
                const toggle = (val) => {
                    if (!onChange) return;
                    const exists = value.includes(val);
                    const next = exists ? value.filter(v => v !== val) : [...value, val];
                    onChange(next);
                };
                const removeTag = (val) => onChange && onChange(value.filter(v => v !== val));
                const clearAll = () => onChange && onChange([]);
                const selectedItems = options.filter(opt => value.includes(opt.value));
                return (
                    <div className="tag-select" ref={wrapperRef}>
                        <div className={`tag-select-control ${disabled ? 'disabled' : ''}`} onClick={() => !disabled && setOpen(!open)}>
                            {selectedItems.length === 0 ? (
                                <span className="placeholder text-muted">{placeholder}</span>
                            ) : (
                                <div className="tags">
                                    {selectedItems.map(item => (
                                        <span className="tag" key={item.value} onClick={(e) => e.stopPropagation()}>
                                            {item.label}
                                            <button type="button" aria-label="Remove" className="tag-remove" onClick={(e) => { e.stopPropagation(); removeTag(item.value); }}>&times;</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <span className={`chevron ${open ? 'open' : ''}`}><i className="bi bi-chevron-down"></i></span>
                        </div>
                        {open && (
                            <div className="tag-select-menu">
                                <div className="search-box">
                                    <i className="bi bi-search me-2 text-muted"></i>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search roles..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                    {value.length > 0 && (
                                        <button type="button" className="btn btn-link btn-sm ms-2 text-decoration-none" onClick={clearAll}>Clear</button>
                                    )}
                                </div>
                                <ul className="options list-unstyled mb-0">
                                    {filtered.length === 0 ? (
                                        <li className="px-2 py-2 text-muted small">No matches</li>
                                    ) : (
                                        filtered.map(opt => {
                                            const checked = value.includes(opt.value);
                                            return (
                                                <li key={opt.value} className="option-item" onClick={() => toggle(opt.value)}>
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="checkbox" readOnly checked={checked} />
                                                        <label className="form-check-label">{opt.label}</label>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            }

            const roleOptions = useMemo(() => (roles || []).map(r => ({
                value: String(r.name || '').toLowerCase(),
                label: String(r.name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            })), [roles]);

            return (
        <div>
                        <Card className="mb-4 content-card">
                            <Card.Header as="h5">Broadcast Notification</Card.Header>
                            <Card.Body>
                                <Row className="g-3 align-items-center">
                                    <Col md={4}>
                                        <Form.Label className="mb-1 small text-muted">Target Roles (optional)</Form.Label>
                                        <TagSelect
                                            options={roleOptions}
                                            value={rbacRoles}
                                            onChange={setRbacRoles}
                                            placeholder="Select roles..."
                                        />
                                        <div className="form-text">Leave empty to send to all users.</div>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="mb-1 small text-muted">Message</Form.Label>
                                        <Form.Control
                                            placeholder="Message to send"
                                            value={broadcastMessage}
                                            onChange={(e) => setBroadcastMessage(e.target.value)}
                                        />
                                    </Col>
                                    <Col md="auto" className="d-flex justify-content-end">
                                        <Button size="sm" onClick={handleSendBroadcast} disabled={isBroadcasting} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                                            {isBroadcasting ? <Spinner as="span" size="sm" /> : <><i className="bi bi-send me-2"></i>Send</>}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

          <div className="content-card mt-4">
              <div className="d-flex justify-content-between align-items-center mb-4"><h1>User Management</h1><Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-person-plus-fill me-2"></i> Add User</Button></div>
              {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : error ? <Alert variant="danger">{error}</Alert> :
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Programs</th>
                                                <th>OTP</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                      <tbody>{users.map(user => {
                        const programList = Array.isArray(user.coordinated_programs) && user.coordinated_programs.length > 0
                            ? user.coordinated_programs.map(program => program.code || program.name).join(', ')
                            : '—';
                        return (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><Badge pill bg={user.role?.name === 'admin' ? 'primary' : 'secondary'}>{user.role?.name || 'N/A'}</Badge></td>
                                <td>
                                    {programList === '—' || !Array.isArray(user.coordinated_programs) ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <div className="d-flex flex-wrap gap-1">
                                            {user.coordinated_programs.map((program) => (
                                                <Badge key={program.id} bg="light" text="dark" className="border">
                                                    {program.code ? `${program.code}` : program.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                                                <td className="align-middle">
                                                                    {user.google2fa_enabled ? <Badge bg="success">Enabled</Badge> : <Badge bg="secondary">Disabled</Badge>}
                                                                    <Button
                                                                        variant={user.google2fa_enabled ? 'outline-danger' : 'outline-success'}
                                                                        size="sm"
                                                                        className="ms-2"
                                                                        disabled={togglingUserId === user.id}
                                                                        onClick={() => handleToggleOtp(user)}
                                                                        title={user.google2fa_enabled ? 'Disable OTP' : 'Enable OTP'}
                                                                    >
                                                                        {togglingUserId === user.id ? <Spinner as="span" size="sm" /> : (user.google2fa_enabled ? 'Disable' : 'Enable')}
                                                                    </Button>
                                                                </td>
                                <td>
                          <Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(user)}><i className="bi bi-pencil-square"></i> Edit</Button>
                          <Button variant="danger" size="sm" className="me-2" onClick={() => handleDeleteUser(user.id)}><i className="bi bi-trash"></i> Delete</Button>
                          <Button variant="info" size="sm" onClick={() => onManageQualifications(user)}><i className="bi bi-award"></i> Qualifications</Button>
                      </td></tr>);
                      })}</tbody>
                  </Table>}
              {currentUserData && <Modal show={showModal} onHide={handleCloseModal}><Modal.Header closeButton><Modal.Title>{currentUserData.id ? 'Edit User' : 'Add New User'}</Modal.Title></Modal.Header><Modal.Body><Form>
                  <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" value={currentUserData.name} onChange={(e) => setCurrentUserData({ ...currentUserData, name: e.target.value })} required /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Email Address</Form.Label><Form.Control type="email" value={currentUserData.email} onChange={(e) => setCurrentUserData({ ...currentUserData, email: e.target.value })} required /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Role</Form.Label>
                      <Form.Select value={currentUserData.role_id || ''} onChange={handleRoleChange} required>
                          <option value="" disabled>Select a role</option>
                          {roles.map(role => ( <option key={role.id} value={role.id}>{role.name}</option> ))}
                      </Form.Select>
                  </Form.Group>
                  {isCoordinatorRoleSelected && (
                      <Form.Group className="mb-3">
                          <Form.Label>Assigned Programs</Form.Label>
                          <Form.Select
                              multiple
                              value={currentUserData.coordinated_program_ids || []}
                              onChange={handleProgramSelectionChange}
                              size={Math.min(Math.max(programs.length, 4), 10)}
                          >
                              {programs.length === 0 ? (
                                  <option value="" disabled>No programs available</option>
                              ) : (
                                  sortedPrograms.map((program) => (
                                      <option key={program.id} value={String(program.id)}>
                                          {program.code ? `${program.code} • ${program.name}` : program.name}
                                      </option>
                                  ))
                              )}
                          </Form.Select>
                          <Form.Text muted>Select one or more programs that this coordinator manages.</Form.Text>
                          {selectedCoordinatorPrograms.length > 0 && (
                              <div className="mt-2 d-flex flex-wrap gap-2">
                                  {selectedCoordinatorPrograms.map((program) => (
                                      <Badge key={program.id} bg="secondary" className="px-2 py-1">
                                          {program.code ? `${program.code}` : program.name}
                                      </Badge>
                                  ))}
                              </div>
                          )}
                      </Form.Group>
                  )}
                  <hr /><p className="text-muted">{currentUserData.id ? 'Leave password fields blank to keep current password.' : ''}</p>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <PasswordInput placeholder={currentUserData.id ? 'New Password' : ''} onChange={(e) => setCurrentUserData({ ...currentUserData, password: e.target.value })} required={!currentUserData.id} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <PasswordInput placeholder={currentUserData.id ? 'Confirm New Password' : ''} onChange={(e) => setCurrentUserData({ ...currentUserData, password_confirmation: e.target.value })} required={!currentUserData.id} />
                                    </Form.Group>
              </Form></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button><Button variant="primary" onClick={handleSaveUser} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}</Button></Modal.Footer></Modal>}
          </div>
      </div>
      );
  }
  
  function AuditSchedulePage() {
      const [audits, setAudits] = useState([]);
      const [programs, setPrograms] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [error, setError] = useState('');
      const [showModal, setShowModal] = useState(false);
      const [currentAudit, setCurrentAudit] = useState(null);
  
      const fetchAudits = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/audit-schedules');
            if (!response.ok) throw new Error('Failed to fetch audits.');
            setAudits(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
      
      const fetchPrograms = async () => {
        try {
            const response = await apiFetch('/api/programs');
            if (!response.ok) throw new Error('Failed to fetch programs.');
            setPrograms(await response.json());
        } catch (err) { console.error(err.message); }
    };
  
      useEffect(() => {
        fetchAudits();
        fetchPrograms();
    }, []);
  
      const handleShowModal = (audit = null) => {
        setCurrentAudit(audit || { program_id: '', audit_date: '', status: 'Scheduled', notes: '' });
        setShowModal(true);
    };
  
      const handleCloseModal = () => setShowModal(false);
  
      const handleSaveAudit = async () => {
        setIsSaving(true);
    const url = currentAudit.id ? `/api/audit-schedules/${currentAudit.id}` : '/api/audit-schedules';
        const method = currentAudit.id ? 'PUT' : 'POST';
        try {
            const response = await apiFetch(url, {
                method,
                body: JSON.stringify(currentAudit),
            });
            const data = await response.json();
            if (!response.ok) {
                if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
                throw new Error(data.message || 'Failed to save audit.');
            }
            fetchAudits();
            handleCloseModal();
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
  
      const handleDeleteAudit = async (auditId) => {
        const ok = await notify.confirm({ text: 'This will permanently delete the audit schedule.' });
        if (!ok) return;
    apiFetch(`/api/audit-schedules/${auditId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete audit.');
                fetchAudits();
                notify.toast({ icon: 'success', title: 'Audit deleted' });
            })
            .catch(err => notify.error('Delete failed', err.message));
    };
      
      const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'warning';
            case 'Scheduled': return 'info';
            default: return 'secondary';
        }
    };
  
      return (<div className="content-card">
          <div className="d-flex justify-content-between align-items-center mb-4"><h1>Internal Audit Scheduler</h1><Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-calendar-plus me-2"></i> Schedule Audit</Button></div>
          {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : error ? <Alert variant="danger">{error}</Alert> :
              <Table striped bordered hover responsive><thead><tr><th>Program</th><th>Audit Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>{audits.map(audit => <tr key={audit.id}><td>{audit.program ? (audit.program.code ? `${audit.program.code} • ${audit.program.name}` : audit.program.name) : 'N/A'}</td><td>{audit.audit_date}</td><td><Badge bg={getStatusBadge(audit.status)}>{audit.status}</Badge></td><td>{audit.notes}</td><td><Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(audit)}><i className="bi bi-pencil-square"></i> Edit</Button><Button variant="danger" size="sm" onClick={() => handleDeleteAudit(audit.id)}><i className="bi bi-trash"></i> Delete</Button></td></tr>)}</tbody>
              </Table>}
          {currentAudit && <Modal show={showModal} onHide={handleCloseModal}><Modal.Header closeButton><Modal.Title>{currentAudit.id ? 'Edit Audit Schedule' : 'Schedule New Audit'}</Modal.Title></Modal.Header><Modal.Body><Form>
              <Form.Group className="mb-3"><Form.Label>Program</Form.Label><Form.Select defaultValue={currentAudit.program_id} onChange={(e) => setCurrentAudit({ ...currentAudit, program_id: e.target.value })} required>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Audit Date</Form.Label><Form.Control type="date" defaultValue={currentAudit.audit_date} onChange={(e) => setCurrentAudit({ ...currentAudit, audit_date: e.target.value })} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select defaultValue={currentAudit.status} onChange={(e) => setCurrentAudit({ ...currentAudit, status: e.target.value })} required><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></Form.Select></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} defaultValue={currentAudit.notes || ''} onChange={(e) => setCurrentAudit({ ...currentAudit, notes: e.target.value })} /></Form.Group>
          </Form></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button><Button variant="primary" onClick={handleSaveAudit} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}</Button></Modal.Footer></Modal>}
      </div>);
  }
  
  function AccreditorVisitPage() {
      const [visits, setVisits] = useState([]);
      const [programs, setPrograms] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [error, setError] = useState('');
      const [showModal, setShowModal] = useState(false);
      const [currentVisit, setCurrentVisit] = useState(null);
  
      const fetchVisits = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/visits');
            if (!response.ok) throw new Error('Failed to fetch visits.');
            setVisits(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
  
      const fetchPrograms = async () => {
        try {
            const response = await apiFetch('/api/programs');
            if (!response.ok) throw new Error('Failed to fetch programs.');
            setPrograms(await response.json());
        } catch (err) { console.error(err.message); }
    };
  
      useEffect(() => {
        fetchVisits();
        fetchPrograms();
    }, []);
  
      const handleShowModal = (visit = null) => {
        setCurrentVisit(visit || { program_id: '', accreditor_name: '', visit_date: '', status: 'Planned', notes: '' });
        setShowModal(true);
    };
  
      const handleCloseModal = () => setShowModal(false);
  
      const handleSaveVisit = async () => {
        setIsSaving(true);
        const url = currentVisit.id ? `/api/visits/${currentVisit.id}` : '/api/visits';
        const method = currentVisit.id ? 'PUT' : 'POST';
        try {
            const response = await apiFetch(url, { method, body: JSON.stringify(currentVisit) });
            const data = await response.json();
            if (!response.ok) {
                if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
                throw new Error(data.message || 'Failed to save visit.');
            }
            fetchVisits();
            handleCloseModal();
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
  
      const handleDeleteVisit = async (visitId) => {
        const ok = await notify.confirm({ text: 'This will permanently delete the visit.' });
        if (!ok) return;
        apiFetch(`/api/visits/${visitId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete visit.');
                fetchVisits();
                notify.toast({ icon: 'success', title: 'Visit deleted' });
            })
            .catch(err => notify.error('Delete failed', err.message));
    };
  
      const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Confirmed': return 'info';
            case 'Planned': return 'secondary';
            default: return 'light';
        }
    };
  
      return (<div className="content-card">
          <div className="d-flex justify-content-between align-items-center mb-4"><h1>Accreditor Visits</h1><Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-calendar-plus me-2"></i> Log Visit</Button></div>
          {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : error ? <Alert variant="danger">{error}</Alert> :
              <Table striped bordered hover responsive><thead><tr><th>Program</th><th>Accreditor Name</th><th>Visit Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>{visits.map(visit => <tr key={visit.id}><td>{visit.program ? (visit.program.code ? `${visit.program.code} • ${visit.program.name}` : visit.program.name) : 'N/A'}</td><td>{visit.accreditor_name}</td><td>{visit.visit_date}</td><td><Badge bg={getStatusBadge(visit.status)}>{visit.status}</Badge></td><td>{visit.notes}</td><td><Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(visit)}><i className="bi bi-pencil-square"></i> Edit</Button><Button variant="danger" size="sm" onClick={() => handleDeleteVisit(visit.id)}><i className="bi bi-trash"></i> Delete</Button></td></tr>)}</tbody>
              </Table>}
          {currentVisit && <Modal show={showModal} onHide={handleCloseModal}><Modal.Header closeButton><Modal.Title>{currentVisit.id ? 'Edit Accreditor Visit' : 'Log New Accreditor Visit'}</Modal.Title></Modal.Header><Modal.Body><Form>
              <Form.Group className="mb-3"><Form.Label>Program</Form.Label><Form.Select defaultValue={currentVisit.program_id} onChange={(e) => setCurrentVisit({ ...currentVisit, program_id: e.target.value })} required>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Accreditor Name</Form.Label><Form.Control type="text" defaultValue={currentVisit.accreditor_name} onChange={(e) => setCurrentVisit({ ...currentVisit, accreditor_name: e.target.value })} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Visit Date</Form.Label><Form.Control type="date" defaultValue={currentVisit.visit_date} onChange={(e) => setCurrentVisit({ ...currentVisit, visit_date: e.target.value })} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select defaultValue={currentVisit.status} onChange={(e) => setCurrentVisit({ ...currentVisit, status: e.target.value })} required><option value="Planned">Planned</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option></Form.Select></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} defaultValue={currentVisit.notes || ''} onChange={(e) => setCurrentVisit({ ...currentVisit, notes: e.target.value })} /></Form.Group>
          </Form></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button><Button variant="primary" onClick={handleSaveVisit} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}</Button></Modal.Footer></Modal>}
      </div>);
  }
  
  function FacultyQualificationPage({ user, onBack }) {
      const [qualifications, setQualifications] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [showModal, setShowModal] = useState(false);
      const [newQual, setNewQual] = useState({ type: 'Degree', name: '', institution: '', year_obtained: new Date().getFullYear() });
  
      const fetchQualifications = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiFetch(`/api/users/${user.id}/qualifications`);
            if (!response.ok) throw new Error('Failed to fetch qualifications.');
            setQualifications(await response.json());
        } catch (err) { console.error(err.message); } finally { setIsLoading(false); }
    };
  
      useEffect(() => {
        fetchQualifications();
    }, [user]);
  
      const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await apiFetch(`/api/users/${user.id}/qualifications`, {
                method: 'POST',
                body: JSON.stringify(newQual)
            });
            if (!response.ok) throw new Error('Failed to save qualification.');
            fetchQualifications();
            setShowModal(false);
            setNewQual({ type: 'Degree', name: '', institution: '', year_obtained: new Date().getFullYear() });
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
  
      const handleDelete = async (qualId) => {
        const ok = await notify.confirm({ text: 'This will permanently delete this qualification.' });
        if (!ok) return;
        apiFetch(`/api/qualifications/${qualId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete qualification.');
                fetchQualifications();
                notify.toast({ icon: 'success', title: 'Qualification deleted' });
            })
            .catch(err => notify.error('Delete failed', err.message));
    };
  
      return (
          <div>
              <Button variant="light" onClick={onBack} className="mb-4"><i className="bi bi-arrow-left"></i> Back to Users</Button>
              <div className="content-card">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                      <h1>Qualifications for {user?.name}</h1>
                      <Button onClick={() => setShowModal(true)} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-plus-circle me-2"></i> Add Qualification</Button>
                  </div>
                  {isLoading ? <div className="text-center p-5"><Spinner /></div> : (
                      <Table striped bordered hover responsive>
                          <thead><tr><th>Type</th><th>Name</th><th>Institution</th><th>Year</th><th>Action</th></tr></thead>
                          <tbody>
                              {qualifications.map(q => (
                                  <tr key={q.id}>
                                      <td><Badge bg={q.type === 'Degree' ? 'primary' : (q.type === 'Certification' ? 'success' : 'info')}>{q.type}</Badge></td>
                                      <td>{q.name}</td>
                                      <td>{q.institution}</td>
                                      <td>{q.year_obtained}</td>
                                      <td><Button variant="danger" size="sm" onClick={() => handleDelete(q.id)}><i className="bi bi-trash"></i></Button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </Table>
                  )}
              </div>
              <Modal show={showModal} onHide={() => setShowModal(false)}>
                  <Modal.Header closeButton><Modal.Title>Add New Qualification</Modal.Title></Modal.Header>
                  <Modal.Body>
                      <Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select value={newQual.type} onChange={e => setNewQual({...newQual, type: e.target.value})}><option>Degree</option><option>Certification</option><option>Training</option></Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Name / Title</Form.Label><Form.Control type="text" value={newQual.name} onChange={e => setNewQual({...newQual, name: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Institution / Issuing Body</Form.Label><Form.Control type="text" value={newQual.institution} onChange={e => setNewQual({...newQual, institution: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Year Obtained</Form.Label><Form.Control type="number" value={newQual.year_obtained} onChange={e => setNewQual({...newQual, year_obtained: e.target.value})} /></Form.Group>
                  </Modal.Body>
                  <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                      <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save'}</Button>
                  </Modal.Footer>
              </Modal>
          </div>
      );
  }
  
  function FacilityManagementPage() {
      const [facilities, setFacilities] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [showModal, setShowModal] = useState(false);
    const [currentFacility, setCurrentFacility] = useState(null);
      const [selectedImageFile, setSelectedImageFile] = useState(null);
      const [imageError, setImageError] = useState('');
    const [imagePreview, setImagePreview] = useState({ show: false, url: '', name: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const filteredFacilities = useMemo(() => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return facilities;
      return facilities.filter((facility) => {
        const name = String(facility.name || '').toLowerCase();
        const location = String(facility.location || '').toLowerCase();
        const type = String(facility.type || '').toLowerCase();
        const condition = String(facility.condition_status || '').toLowerCase();
        const notes = String(facility.notes || '').toLowerCase();
        return name.includes(query) || location.includes(query) || type.includes(query) || condition.includes(query) || notes.includes(query);
      });
    }, [facilities, searchTerm]);
  
      const fetchFacilities = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/facilities');
            if (!response.ok) throw new Error('Failed to fetch facilities.');
            setFacilities(await response.json());
        } catch (err) { console.error(err.message); } finally { setIsLoading(false); }
    };
  
      useEffect(() => { fetchFacilities(); }, []);
  
            const handleShowModal = (facility = null) => {
                setCurrentFacility(facility || { name: '', location: '', type: 'Classroom', capacity: 0, condition_status: 'Good', notes: '', image_url: '' });
                setSelectedImageFile(null);
                setImageError('');
        setShowModal(true);
    };
  
      const handleSave = async () => {
        setIsSaving(true);
        const url = currentFacility.id ? `/api/facilities/${currentFacility.id}` : '/api/facilities';
        const method = currentFacility.id ? 'PUT' : 'POST';
        try {
            // Build multipart form data
            const formData = new FormData();
            formData.append('name', currentFacility.name || '');
            formData.append('location', currentFacility.location || '');
            formData.append('type', currentFacility.type || '');
            if (currentFacility.capacity !== undefined && currentFacility.capacity !== null) {
                formData.append('capacity', String(currentFacility.capacity));
            }
            formData.append('condition_status', currentFacility.condition_status || '');
            if (currentFacility.notes) formData.append('notes', currentFacility.notes);
            // If user selected a file, attach it
            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
            } else if (currentFacility.image_url) {
                // Backward compatibility: allow direct URL if provided
                formData.append('image_url', currentFacility.image_url);
            }

            // Important: PHP only populates $_FILES for POST with multipart/form-data.
            // For updates with files, use method override via _method=PUT.
            let fetchMethod = method;
            if (method === 'PUT') {
                formData.append('_method', 'PUT');
                fetchMethod = 'POST';
            }

            const response = await apiFetch(url, { method: fetchMethod, body: formData, headers: {} });
            if (!response.ok) {
                try {
                    const err = await response.json();
                    const message = typeof err === 'string' ? err : (err.message || Object.values(err || {}).flat().join(' ') || 'Failed to save facility.');
                    throw new Error(message);
                } catch (_) {
                    throw new Error('Failed to save facility.');
                }
            }
            fetchFacilities();
            setShowModal(false);
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
  
      const handleDelete = async (id) => {
        const ok = await notify.confirm({ text: 'This will permanently delete the facility.' });
        if (!ok) return;
        apiFetch(`/api/facilities/${id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete facility.');
                fetchFacilities();
                notify.toast({ icon: 'success', title: 'Facility deleted' });
            })
            .catch(err => notify.error('Delete failed', err.message));
    };
  
      return (
          <div className="content-card">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <h1 className="mb-0">Facilities Monitoring</h1>
                  <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 w-100 w-md-auto">
                      <Form.Control
                          type="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search facilities..."
                          style={{ maxWidth: '260px' }}
                      />
                      <Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>
                          <i className="bi bi-plus-circle me-2"></i> Add Facility
                      </Button>
                  </div>
              </div>
              {isLoading ? <div className="text-center p-5"><Spinner /></div> : (
                  filteredFacilities.length === 0 ? (
                      <div className="text-center text-muted py-5">No facilities match your search.</div>
                  ) : (
                      <Table striped bordered hover responsive>
                          <thead><tr><th>Name</th><th>Location</th><th>Type</th><th>Capacity</th><th>Condition</th><th>Remarks</th><th>Image</th><th>Actions</th></tr></thead>
                          <tbody>
                              {filteredFacilities.map(f => (
                                  <tr key={f.id}>
                                  <td>{f.name}</td>
                                  <td>{f.location}</td>
                                  <td>{f.type}</td>
                                  <td>{f.capacity}</td>
                                  <td><Badge bg={f.condition_status === 'Excellent' ? 'success' : 'warning'}>{f.condition_status}</Badge></td>
                                  <td>{f.notes ? f.notes : <span className="text-muted">—</span>}</td>
                                  <td>
                                      {f.image_url ? (
                                          <Button
                                              variant="link"
                                              size="sm"
                                              className="p-0"
                                              onClick={() => setImagePreview({ show: true, url: f.image_url, name: f.name })}
                                          >
                                              View
                                          </Button>
                                      ) : (
                                          <span className="text-muted">—</span>
                                      )}
                                  </td>
                                  <td>
                                      <Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(f)}><i className="bi bi-pencil-square"></i></Button>
                                      <Button variant="danger" size="sm" onClick={() => handleDelete(f.id)}><i className="bi bi-trash"></i></Button>
                                  </td>
                                  </tr>
                              ))}
                          </tbody>
                      </Table>
                  )
              )}
              {currentFacility && <Modal show={showModal} onHide={() => setShowModal(false)}>
                  <Modal.Header closeButton><Modal.Title>{currentFacility.id ? 'Edit Facility' : 'Add New Facility'}</Modal.Title></Modal.Header>
                  <Modal.Body>
                      <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={currentFacility.name} onChange={e => setCurrentFacility({...currentFacility, name: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Location</Form.Label><Form.Control type="text" value={currentFacility.location} onChange={e => setCurrentFacility({...currentFacility, location: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select value={currentFacility.type} onChange={e => setCurrentFacility({...currentFacility, type: e.target.value})}><option>Classroom</option><option>Laboratory</option><option>Office</option><option>Library</option><option>Other</option></Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Capacity</Form.Label><Form.Control type="number" value={currentFacility.capacity} onChange={e => setCurrentFacility({...currentFacility, capacity: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Condition</Form.Label><Form.Select value={currentFacility.condition_status} onChange={e => setCurrentFacility({...currentFacility, condition_status: e.target.value})}><option>Excellent</option><option>Good</option><option>Needs Repair</option></Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Remarks</Form.Label><Form.Control as="textarea" rows={3} value={currentFacility.notes} onChange={e => setCurrentFacility({ ...currentFacility, notes: e.target.value })} /></Form.Group>
                      <Form.Group className="mb-3">
                          <Form.Label>Facility Image</Form.Label>
                          <Form.Control type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              setImageError('');
                              setSelectedImageFile(null);
                              if (!file) return;
                              // Basic client-side validation: type and size (<= 5MB)
                              const validTypes = ['image/jpeg','image/png','image/jpg','image/gif','image/webp'];
                              if (!validTypes.includes(file.type)) {
                                  setImageError('Unsupported file type. Please upload a JPG, PNG, GIF, or WEBP image.');
                                  return;
                              }
                              const maxBytes = 5 * 1024 * 1024; // 5MB
                              if (file.size > maxBytes) {
                                  setImageError('File is too large. Maximum size is 5MB.');
                                  return;
                              }
                              setSelectedImageFile(file);
                          }} />
                          {imageError && <Form.Text className="text-danger">{imageError}</Form.Text>}
                          {!imageError && (selectedImageFile || currentFacility.image_url) && (
                              <div className="mt-2">
                                  <div className="text-muted small mb-1">Preview / Current:</div>
                                  {selectedImageFile ? (
                                      <img alt="Preview" src={URL.createObjectURL(selectedImageFile)} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, border: '1px solid #eee' }} />
                                  ) : (
                                      currentFacility.image_url && <img alt="Current" src={currentFacility.image_url} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, border: '1px solid #eee' }} />
                                  )}
                              </div>
                          )}
                          {!selectedImageFile && !currentFacility.image_url && <Form.Text muted>Optional. You can upload an image to represent this facility.</Form.Text>}
                      </Form.Group>
                  </Modal.Body>
                  <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                      <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save'}</Button>
                  </Modal.Footer>
              </Modal>}
              <Modal show={imagePreview.show} onHide={() => setImagePreview({ show: false, url: '', name: '' })} size="lg" centered>
                  <Modal.Header closeButton>
                      <Modal.Title>{imagePreview.name || 'Facility Image'}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                      {imagePreview.url ? (
                          <Image src={imagePreview.url} alt={imagePreview.name || 'Facility'} fluid rounded />
                      ) : (
                          <div className="text-muted">Image not available.</div>
                      )}
                  </Modal.Body>
              </Modal>
          </div>
      );
  }
  
    function ActionPlanPage({ program, onBack, backLabel = 'Back to Programs' }) {
      const [actionPlans, setActionPlans] = useState([]);
      const [users, setUsers] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [showModal, setShowModal] = useState(false);
      const [currentPlan, setCurrentPlan] = useState(null);
  
      const fetchActionPlans = async () => {
        if (!program) return;
        setIsLoading(true);
        try {
            const response = await apiFetch(`/api/programs/${program.id}/action-plans`);
            if (!response.ok) throw new Error('Failed to fetch action plans.');
            setActionPlans(await response.json());
        } catch (err) { console.error(err.message); } finally { setIsLoading(false); }
    };
      
      const fetchUsers = async () => {
        try {
            const response = await apiFetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users.');
            setUsers(await response.json());
        } catch (err) { console.error(err.message); }
    };
  
      useEffect(() => {
        if (program) {
            fetchActionPlans();
            fetchUsers();
        }
    }, [program]);
  
      const handleShowModal = (plan = null) => {
        setCurrentPlan(plan || { title: '', description: '', status: 'Not Started', due_date: '', assigned_to_user_id: null });
        setShowModal(true);
    };
  
      const handleSave = async () => {
        setIsSaving(true);
        const url = currentPlan.id ? `/api/action-plans/${currentPlan.id}` : `/api/programs/${program.id}/action-plans`;
        const method = currentPlan.id ? 'PUT' : 'POST';
        try {
            const response = await apiFetch(url, { method, body: JSON.stringify(currentPlan) });
            if (!response.ok) throw new Error('Failed to save action plan.');
            fetchActionPlans();
            setShowModal(false);
    } catch (err) { notify.error('Save failed', err.message); } finally { setIsSaving(false); }
    };
      
      const getStatusBadge = (status) => {
        if (status === 'Completed') return 'success';
        if (status === 'In Progress') return 'primary';
        return 'secondary';
    };
      
      return (
          <div>
              <Button variant="light" onClick={onBack} className="mb-4"><i className="bi bi-arrow-left"></i> {backLabel}</Button>
              <div className="content-card">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                          <h1 className="mb-1">Action Plans for {program?.code || program?.name}</h1>
                          {program?.code && program?.name && program.code !== program.name && (
                              <div className="text-muted">{program.name}</div>
                          )}
                      </div>
                      <Button onClick={() => handleShowModal()} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}><i className="bi bi-plus-circle me-2"></i> New Action Plan</Button>
                  </div>
                  {isLoading ? <div className="text-center p-5"><Spinner /></div> : (
                      <Row>
                          {actionPlans.map(plan => (
                              <Col md={6} lg={4} key={plan.id} className="mb-4">
                                  <Card>
                                      <Card.Header>
                                          <div className="d-flex justify-content-between">
                                              <span>Due: {plan.due_date || 'N/A'}</span>
                                              <Badge bg={getStatusBadge(plan.status)}>{plan.status}</Badge>
                                          </div>
                                      </Card.Header>
                                      <Card.Body>
                                          <Card.Title>{plan.title}</Card.Title>
                                          <Card.Text>{plan.description}</Card.Text>
                                          <hr />
                                          <small className="text-muted">Assigned to: {plan.assigned_user?.name || 'Unassigned'}</small>
                                      </Card.Body>
                                      <Card.Footer>
                                          <Button variant="primary" size="sm" onClick={() => handleShowModal(plan)}>Edit</Button>
                                      </Card.Footer>
                                  </Card>
                              </Col>
                          ))}
                      </Row>
                  )}
              </div>
              {currentPlan && <Modal show={showModal} onHide={() => setShowModal(false)}>
                  <Modal.Header closeButton><Modal.Title>{currentPlan.id ? 'Edit Action Plan' : 'New Action Plan'}</Modal.Title></Modal.Header>
                  <Modal.Body>
                      <Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control type="text" value={currentPlan.title} onChange={e => setCurrentPlan({...currentPlan, title: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={currentPlan.description} onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={currentPlan.status} onChange={e => setCurrentPlan({...currentPlan, status: e.target.value})}><option>Not Started</option><option>In Progress</option><option>Completed</option></Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Due Date</Form.Label><Form.Control type="date" value={currentPlan.due_date} onChange={e => setCurrentPlan({...currentPlan, due_date: e.target.value})} /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Assign To</Form.Label><Form.Select value={currentPlan.assigned_to_user_id || ''} onChange={e => setCurrentPlan({...currentPlan, assigned_to_user_id: e.target.value})}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Form.Select></Form.Group>
                  </Modal.Body>
                  <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                      <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ backgroundColor: 'var(--primary-purple)', border: 'none' }}>{isSaving ? <Spinner as="span" size="sm" /> : 'Save'}</Button>
                  </Modal.Footer>
              </Modal>}
          </div>
      );
  }
  
  // Announcements page removed; broadcasts are now handled in User Management

// --- Main Dashboard Layout ---
function DashboardLayout({ user, onLogout, setUser }) {
    const [currentView, setCurrentView] = useState(() => (
        user?.role?.name?.toLowerCase() === 'program_coordinator' ? 'COORDINATOR_DASHBOARD' : 'DASHBOARD'
    ));
    const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 992);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 992);
    const [activeSarId, setActiveSarId] = useState(null);
    const [activeSarInitialSection, setActiveSarInitialSection] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [documentOrigin, setDocumentOrigin] = useState('PROGRAMS');
    const [documentBackLabel, setDocumentBackLabel] = useState('Back to Programs');
    const [actionPlanOrigin, setActionPlanOrigin] = useState('PROGRAMS');
    const [actionPlanBackLabel, setActionPlanBackLabel] = useState('Back to Programs');
    const [selectedUser, setSelectedUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read_at).length;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const roleName = user?.role?.name?.toLowerCase() || '';

    // App-wide refresh dispatcher for certain notification types
    const dispatchRefreshFromNotification = useCallback((n) => {
        try {
            const t = (n?.type || '').toString();
            if (t === 'document_status' || t === 'document_upload') {
                window.dispatchEvent(new CustomEvent('documents:changed'));
                window.dispatchEvent(new CustomEvent('dashboard:refresh'));
            } else if (t === 'sar' || t === 'comment') {
                window.dispatchEvent(new CustomEvent('dashboard:refresh'));
            } else if (t === 'audit_update' || t === 'visit_update' || t === 'status_update') {
                window.dispatchEvent(new CustomEvent('dashboard:refresh'));
            }
        } catch (e) {
            // ignore
        }
    }, []);


    const fetchNotifications = async (onlyUnread = false) => {
        try {
            const url = onlyUnread ? '/api/notifications/unread' : '/api/notifications';
            const response = await apiFetch(url);
            if (!response.ok) throw new Error('Failed to fetch notifications.');
            const data = await response.json();

            if (onlyUnread) {
                // Merge unread notifications into the existing list without duplicating
                try {
                    const existingIds = new Set(notifications.map(n => n.id));
                    const newOnes = Array.isArray(data) ? data.filter(n => !existingIds.has(n.id)) : [];
                    setNotifications(prev => [...newOnes, ...prev]);
                } catch (e) {
                    // Fallback: replace entirely if merge fails for some reason
                    setNotifications(data);
                }
            } else {
                setNotifications(data);
            }
        } catch (err) {
            setError(err.message);
            console.error("Failed to fetch notifications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
          // On normal mount (or token change) load all notifications
          fetchNotifications(false);

        // SSE for realtime notifications
        let es;
        if (typeof window !== 'undefined' && window.EventSource) {
                const token = localStorage.getItem('authToken');
            const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
            const url = `${base}/api/notifications/stream?token=${encodeURIComponent(token || '')}`;
            es = new EventSource(url, { withCredentials: false });
            // Expose globally for feature modules to piggy-back
            try { window.__appEventSource = es; } catch {}
            es.addEventListener('notification', (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    setNotifications(prev => [{ id: data.id || Date.now(), ...data }, ...prev]);
                    notify.toast({ icon: 'info', title: 'Notification', text: data.message });
                    // Trigger live refreshes for specific types
                    dispatchRefreshFromNotification(data);
                } catch (e) { /* ignore */ }
            });
            es.addEventListener('error', () => {
                // Let browser auto-retry; no-op
            });
        }
        
        // Ask for permission on mount
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }


        return () => {
            if (es && es.close) es.close();
        };
    }, [user.id]);


    useEffect(() => {
        const handleResize = () => {
            const isWide = window.innerWidth > 992;
            setIsDesktop(isWide);
            setSidebarVisible(isWide);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        return () => {
            if (es) es.close();
        };
    }, []);

    useEffect(() => {
        if (roleName === 'program_coordinator' && currentView === 'DASHBOARD') {
            setCurrentView('COORDINATOR_DASHBOARD');
        } else if (roleName !== 'program_coordinator' && currentView === 'COORDINATOR_DASHBOARD') {
            setCurrentView('DASHBOARD');
        }
    }, [roleName, currentView]);

    const handleViewChange = (view) => {
        setCurrentView(view);
        if (!['DOCUMENTS', 'ACTION_PLANS'].includes(view)) {
            setSelectedProgram(null);
        }
        if (view !== 'QUALIFICATIONS') {
            setSelectedUser(null);
        }
        if (window.innerWidth <= 992) {
            setSidebarVisible(false);
        }
    };

    const handleOpenDocuments = (program, origin = 'DOCUMENT_REPOSITORY') => {
        setSelectedProgram(program);
        setDocumentOrigin(origin);
        setDocumentBackLabel(origin === 'PROGRAMS' ? 'Back to Programs' : 'Back to Document Repository');
        setCurrentView('DOCUMENTS');
        if (window.innerWidth <= 992) {
            setSidebarVisible(false);
        }
    };

    const handleReturnFromDocuments = () => {
        setSelectedProgram(null);
        handleViewChange(documentOrigin);
    };

    const handleOpenActionPlans = (program, origin = 'ACTION_PLANS_OVERVIEW') => {
        setSelectedProgram(program);
        setActionPlanOrigin(origin);
        setActionPlanBackLabel(origin === 'PROGRAMS' ? 'Back to Programs' : 'Back to Action Plans Overview');
        setCurrentView('ACTION_PLANS');
        if (window.innerWidth <= 992) {
            setSidebarVisible(false);
        }
    };

    const handleReturnFromActionPlans = () => {
        setSelectedProgram(null);
        handleViewChange(actionPlanOrigin);
    };

    const handleMarkAsRead = async (id) => {
        try {
            const target = notifications.find(n => n.id === id);
            if (!target?.ephemeral) {
                await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            }
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiFetch('/api/notifications/mark-all-read', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
        }
    };

    const onDeleteNotification = async (id) => {
        try {
            const target = notifications.find(n => n.id === id);
            if (!target?.ephemeral) {
                const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
                // If server says not found, treat as already-deleted and continue
                if (!res.ok && res.status !== 404) {
                    throw new Error(`Delete failed (${res.status})`);
                }
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            // If deletion failed for reasons other than 404, log it
            console.error("Failed to delete notification:", err);
        }
    };
    
    const handleClearAll = async () => {
        // Confirm with the user before mass delete
        const confirmed = await notify.confirm({
            title: 'Clear all notifications?',
            text: 'This will permanently remove all notifications. This cannot be undone.',
            confirmButtonText: 'Yes, clear all',
            cancelButtonText: 'Cancel',
        });
        if (!confirmed) return;

        try {
            // Attempt the bulk clear endpoint first
            const res = await apiFetch('/api/notifications/clear-all', { method: 'DELETE' });
            if (!res.ok) {
                if (res.status === 404) {
                    // Backend doesn't implement bulk clear. Get server-side persisted notifications first
                    try {
                        const listRes = await apiFetch('/api/notifications');
                        if (listRes.ok) {
                            const serverList = await listRes.json();
                            const idsToDelete = serverList.map(n => n.id).filter(Boolean);
                            // delete only those that actually exist on server
                            const deletes = await Promise.allSettled(idsToDelete.map(id => apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })));
                            // ignore 404s in results; if any other status errors, log them
                            deletes.forEach((d, idx) => {
                                if (d.status === 'fulfilled') {
                                    const r = d.value;
                                    if (!r.ok && r.status !== 404) {
                                        console.error(`Failed to delete notification ${idsToDelete[idx]}: ${r.status}`);
                                    }
                                } else {
                                    console.error(`Failed to delete notification ${idsToDelete[idx]}:`, d.reason);
                                }
                            });
                        } else {
                            // If we couldn't get server list, attempt best-effort deletes but ignore 404s
                            const persisted = notifications.filter(n => !n.ephemeral && n.id);
                            const deletes = await Promise.allSettled(persisted.map(n => apiFetch(`/api/notifications/${n.id}`, { method: 'DELETE' })));
                            deletes.forEach((d, idx) => {
                                if (d.status === 'fulfilled') {
                                    const r = d.value;
                                    if (!r.ok && r.status !== 404) {
                                        console.error(`Failed to delete notification ${persisted[idx].id}: ${r.status}`);
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Failed to perform fallback clear-all:', e);
                    }
                } else {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.message || `Clear all failed (${res.status})`);
                }
            } else {
                // cleared by bulk endpoint
            }
            // Clear UI regardless — server-side delete may have removed persisted ones
            setNotifications([]);
            notify.toast({ icon: 'success', title: 'Cleared', text: 'All notifications removed.' });
        } catch (err) {
            // Network or other errors: try best-effort per-item delete
            try {
                // First try to fetch server-side persisted notifications
                const listRes = await apiFetch('/api/notifications');
                if (listRes.ok) {
                    const serverList = await listRes.json();
                    const idsToDelete = serverList.map(n => n.id).filter(Boolean);
                    const deletes = await Promise.allSettled(idsToDelete.map(id => apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })));
                    deletes.forEach((d, idx) => {
                        if (d.status === 'fulfilled') {
                            const r = d.value;
                            if (!r.ok && r.status !== 404) {
                                console.error(`Failed to delete notification ${idsToDelete[idx]}: ${r.status}`);
                            }
                        }
                    });
                    setNotifications([]);
                    notify.toast({ icon: 'success', title: 'Cleared', text: 'All notifications removed.' });
                } else {
                    // fallback: attempt deletes based on UI list but ignore 404s
                    const persisted = notifications.filter(n => !n.ephemeral && n.id);
                    const deletes = await Promise.allSettled(persisted.map(n => apiFetch(`/api/notifications/${n.id}`, { method: 'DELETE' })));
                    deletes.forEach((d, idx) => {
                        if (d.status === 'fulfilled') {
                            const r = d.value;
                            if (!r.ok && r.status !== 404) {
                                console.error(`Failed to delete notification ${persisted[idx].id}: ${r.status}`);
                            }
                        }
                    });
                    setNotifications([]);
                    notify.toast({ icon: 'success', title: 'Cleared', text: 'All notifications removed.' });
                }
            } catch (e2) {
                console.error('Failed to clear all notifications:', err, e2);
            }
        }
    };

    const isAdmin = roleName === 'admin';
    const canReviewDocuments = isAdmin;
    const canAccessCoordinatorDashboard = roleName === 'program_coordinator';
    let mainContent;
    switch (currentView) {
        case 'DASHBOARD':
            mainContent = <DashboardHomepage />;
            break;
        case 'PROGRAMS':
            mainContent = <ProgramManagementPage 
                onManageDocuments={(p) => handleOpenDocuments(p, 'PROGRAMS')}
                onManageActionPlans={(p) => handleOpenActionPlans(p, 'PROGRAMS')}
                isAdmin={isAdmin}
            />;
            break;
        case 'DOCUMENT_REPOSITORY':
            mainContent = <DocumentRepositoryPage onSelectProgram={(p) => handleOpenDocuments(p, 'DOCUMENT_REPOSITORY')} />;
            break;
        case 'DOCUMENTS':
            mainContent = selectedProgram
                ? <DocumentManagementPage
                    program={selectedProgram}
                    onBack={handleReturnFromDocuments}
                    isAdmin={isAdmin}
                    canReview={canReviewDocuments}
                    backLabel={documentBackLabel}
                    onProgramChange={(p) => setSelectedProgram(p)}
                    currentUser={user}
                />
                : <DocumentRepositoryPage onSelectProgram={(p) => handleOpenDocuments(p, 'DOCUMENT_REPOSITORY')} />;
            break;
        case 'COORDINATOR_DASHBOARD':
            mainContent = canAccessCoordinatorDashboard
                ? <CoordinatorDashboardPage canReview={canReviewDocuments} currentUser={user} />
                : (
                    <div className="content-card">
                        <Alert variant="warning" className="mb-0">You do not have access to the coordinator dashboard.</Alert>
                    </div>
                );
            break;
        case 'COMPLIANCE':
            mainContent = <ComplianceMatrixPage />;
            break;
        case 'SAR_OVERVIEW':
            mainContent = <SarOverviewPage onOpenEditor={(id) => { setActiveSarId(id); setCurrentView('SAR_EDITOR'); }} />;
            break;
        case 'SAR_EDITOR':
            mainContent = activeSarId ? <SarEditorPage sarId={activeSarId} initialSection={activeSarInitialSection} onBack={() => setCurrentView('SAR_OVERVIEW')} currentUser={user} /> : (
                <div className="content-card"><Alert variant="warning" className="mb-0">Open a SAR from the overview to edit.</Alert></div>
            );
            break;
        case 'MY_REVIEWS':
            mainContent = <MyReviewsPage onOpenSection={(sarId, sectionNo) => { setActiveSarId(sarId); setActiveSarInitialSection(sectionNo || null); setCurrentView('SAR_EDITOR'); }} />;
            break;
        case 'FACILITIES':
            mainContent = <FacilityManagementPage />;
            break;
        case 'ACTION_PLANS_OVERVIEW':
            mainContent = <ActionPlansOverviewPage onSelectProgram={(p) => handleOpenActionPlans(p, 'ACTION_PLANS_OVERVIEW')} />;
            break;
        case 'ACTION_PLANS':
            mainContent = selectedProgram
                ? <ActionPlanPage program={selectedProgram} onBack={handleReturnFromActionPlans} backLabel={actionPlanBackLabel} />
                : <ActionPlansOverviewPage onSelectProgram={(p) => handleOpenActionPlans(p, 'ACTION_PLANS_OVERVIEW')} />;
            break;
        case 'AUDIT_SCHEDULE':
            mainContent = <AuditSchedulePage />;
            break;
        case 'ACCREDITOR_VISIT':
            mainContent = <AccreditorVisitPage />;
            break;
        case 'USERS':
            mainContent = <UserManagementPage 
                currentUser={user} 
                onManageQualifications={(u) => { setSelectedUser(u); handleViewChange('QUALIFICATIONS'); }}
            />;
            break;
        case 'MESSAGES':
            mainContent = (
                <div className="content-card">
                    <h1>Messages</h1>
                    <p className="text-muted mb-0">Messaging tools are coming soon. Check back later for updates.</p>
                </div>
            );
            break;
        case 'QUALIFICATIONS':
            mainContent = <FacultyQualificationPage user={selectedUser} onBack={() => handleViewChange('USERS')} />;
            break;
        case 'PROFILE':
            mainContent = <ProfilePage user={user} onUserUpdate={setUser} />;
            break;
        case 'ChatbotInterface':
            mainContent = (
                <div className="content-card">
                    <h1>AI Chat Interface</h1>
                    <p className="text-muted mb-0">Engage with the accreditation assistant to get quick guidance on compliance gaps, documentation tips, and next steps.</p>
                </div>
            );
            break;
        case 'ChatHistory':
            mainContent = (
                <div className="content-card">
                    <h1>Chat History</h1>
                    <p className="text-muted mb-0">Your past conversations with the AI assistant will appear here once the feature is enabled.</p>
                </div>
            );
            break;
        case 'ChatSettings':
            mainContent = (
                <div className="content-card">
                    <h1>AI Settings</h1>
                    <p className="text-muted mb-0">Configure AI personas, tone, and safety rules to tailor responses for your accreditation workflows.</p>
                </div>
            );
            break;
        default:
            mainContent = <h1>Page Not Found</h1>;
    }

    const toggleSidebar = () => setSidebarVisible((prev) => !prev);

    return (
        <div className="main-wrapper">
            <Sidebar
                user={user}
                onViewChange={handleViewChange}
                currentView={currentView}
                isVisible={sidebarVisible}
                canAccessCoordinatorDashboard={canAccessCoordinatorDashboard}
            />
            <main className={`main-content ${sidebarVisible && isDesktop ? '' : 'sidebar-collapsed'}`}>
                <TopNavbar
                    onLogout={onLogout}
                    onToggleSidebar={toggleSidebar}
                    currentView={currentView}
                    user={user}
                    onViewChange={handleViewChange}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllRead={handleMarkAllRead}
                    onClearAll={handleClearAll}
                    onDeleteNotification={onDeleteNotification}
                />
                <div className="main-content-body">
                    {mainContent}
                </div>
            </main>
            {!isDesktop && sidebarVisible && <div className="sidebar-overlay" onClick={() => setSidebarVisible(false)}></div>}
        </div>
    );
}