import React, { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { apiFetch } from "../utils/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Masterlist() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);

  // Schedule Section modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSection, setScheduleSection] = useState(null);
  const [scheduleClasses, setScheduleClasses] = useState([]);
  const [scheduleRooms, setScheduleRooms] = useState([]);
  const [scheduleSubjects, setScheduleSubjects] = useState([]);
  // Fixed teacher list for scheduling
  const [scheduleTeachers, setScheduleTeachers] = useState([
    { id: 1, name: "Mr. Jessie Aneslagon" },
    { id: 2, name: "Mr. Chae Dela Cruz" },
    { id: 3, name: "Mr. Denmark P. Aduna" },
    { id: 4, name: "Mr. Ronnel Reproto" },
    { id: 5, name: "Mr. Kurt Arellano" },
    { id: 6, name: "Mr Ace Abadenis" },
    { id: 7, name: "Mr. Richard Carpio" },
    { id: 8, name: "Mr. Shozu Abedenis" },
    { id: 9, name: "Mr. Ronnel Manuel" },
    { id: 10, name: "Ms. Shela Cruz" },
    { id: 11, name: "Ms. Abby Manlangit" },
    { id: 12, name: "Ms. Lorena Magsalong" },
    { id: 13, name: "Ms. Annie Cameshorton" },
    { id: 14, name: "Ms. Clarisse Ballesteros" },
    { id: 15, name: "Ms. Andrea Dali" },
    { id: 16, name: "Ms. Bennie Arlante" },
    { id: 17, name: "Mr. Lorence Robin" },
    { id: 18, name: "Mr. Pibels Aduna" },
    { id: 19, name: "Mr. Lloyd Manabat" },
    { id: 20, name: "Mr. Celherson Mesina" },
    { id: 21, name: "Mr. Andrei Quirante" },
  ]);
  const [scheduleDataLoading, setScheduleDataLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    class_id: "",
    room_id: "",
    subjectRows: [{ subject_id: "", teacher_id: "", day: "Mon", start_time: "08:00", end_time: "09:00" }],
  });

  const fetchMasterlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("masterlist");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch masterlist");
      }

      if (json.success && Array.isArray(json.data)) {
        setSections(json.data);
        setTotal(json.total || 0);
        setExpandedSection(null);
      } else {
        setSections([]);
        setTotal(0);
        setError(json.message || "No data returned");
      }
    } catch (err) {
      setSections([]);
      setTotal(0);
      setError(err.message || "Failed to load masterlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterlist();
  }, [fetchMasterlist]);

  const toggleSection = (key) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const openScheduleModal = async (sec, e) => {
    e?.stopPropagation?.();
    setScheduleSection(sec);
    setScheduleForm({
      class_id: "",
      room_id: "",
      subjectRows: [{ subject_id: "", teacher_id: "", day: "Mon", start_time: "08:00", end_time: "09:00" }],
    });
    setScheduleModalOpen(true);
    setScheduleDataLoading(true);
    try {
      const [classesRes, roomsRes, subjectsRes] = await Promise.all([
        apiFetch("select", { method: "POST", body: JSON.stringify({ table: "class" }) }),
        apiFetch("select", { method: "POST", body: JSON.stringify({ table: "rooms" }) }),
        apiFetch("subjects"),
      ]);
      const classesData = await classesRes.json();
      const roomsData = await roomsRes.json();
      const subjectsData = await subjectsRes.json();
      if (classesData.success) setScheduleClasses(classesData.data || []);
      if (roomsData.success) setScheduleRooms(roomsData.data || []);
      if (Array.isArray(subjectsData)) setScheduleSubjects(subjectsData);
      else if (subjectsData?.data) setScheduleSubjects(subjectsData.data || []);
      else setScheduleSubjects([]);
      // scheduleTeachers is now static
    } catch (err) {
      console.error("Error loading schedule data:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load classes, rooms, or subjects." });
    } finally {
      setScheduleDataLoading(false);
    }
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setScheduleSection(null);
  };

  const addSubjectRow = () => {
    setScheduleForm((f) => ({
      ...f,
      subjectRows: [...f.subjectRows, { subject_id: "", teacher_id: "", day: "Mon", start_time: "08:00", end_time: "09:00" }],
    }));
  };

  const updateSubjectRow = (idx, field, value) => {
    setScheduleForm((f) => ({
      ...f,
      subjectRows: f.subjectRows.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      ),
    }));
  };

  const removeSubjectRow = (idx) => {
    setScheduleForm((f) => ({
      ...f,
      subjectRows: f.subjectRows.filter((_, i) => i !== idx),
    }));
  };

  const parseYearLevel = (yl) => {
    if (!yl) return 1;
    const m = String(yl).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  };

  const createClassFromSection = async () => {
    if (!scheduleSection) return;
    const course = (scheduleSection.course || "").split(" - ")[0] || scheduleSection.course || "GEN";
    const level = parseYearLevel(scheduleSection.year_level);
    const section = scheduleSection.section || "A";
    try {
      const res = await apiFetch("insert", {
        method: "POST",
        body: JSON.stringify({ table: "class", data: { course, level, section } }),
      }, true);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create class");
      const newClass = { id: json.data?.id, course, level, section };
      setScheduleClasses((prev) => [...prev, newClass]);
      setScheduleForm((f) => ({ ...f, class_id: String(newClass.id) }));
      Swal.fire({ icon: "success", title: "Class created", text: `${course} ${level}-${section}` });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to create class." });
    }
  };

  const saveScheduleSection = async (e) => {
    e.preventDefault();
    if (!scheduleForm.class_id || !scheduleForm.room_id) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please select a class and room." });
      return;
    }
    const validRows = scheduleForm.subjectRows.filter(
      (r) => r.subject_id && r.teacher_id && r.day && r.start_time && r.end_time
    );
    if (validRows.length === 0) {
      Swal.fire({ icon: "warning", title: "Required", text: "Add at least one subject with teacher and time." });
      return;
    }
    setScheduleSaving(true);
    const errors = [];
    try {
      for (const row of validRows) {
        const res = await apiFetch("schedules", {
          method: "POST",
          body: JSON.stringify({
            class_id: parseInt(scheduleForm.class_id, 10),
            subject_id: parseInt(row.subject_id, 10),
            teacher_id: parseInt(row.teacher_id, 10),
            room_id: parseInt(scheduleForm.room_id, 10),
            days: [row.day],
            start_time: row.start_time,
            end_time: row.end_time,
          }),
        });
        const json = await res.json();
        if (!res.ok) errors.push(json.message || json.conflicts ? JSON.stringify(json.conflicts) : "Unknown error");
      }
      if (errors.length > 0) {
        Swal.fire({ icon: "warning", title: "Partial failure", html: errors.join("<br/>") });
      } else {
        Swal.fire({ icon: "success", title: "Schedules saved" });
        closeScheduleModal();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save schedules." });
    } finally {
      setScheduleSaving(false);
    }
  };

  const teacherLabel = (u) => u?.name || `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || u?.email || "—";

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  const studentColumns = [
    { name: "#", selector: (_, i) => i + 1, width: "60px" },
    { name: "Student ID", selector: (r) => r.StudentID || r.StudentId || r.student_id || "-", sortable: true },
    { name: "Name", selector: (r) => r.full_name || `${r.FirstName || ""} ${r.LastName || ""}`.trim() || "-", sortable: true },
    { name: "Email", selector: (r) => r.email || "-", sortable: true, grow: 1 },
    { name: "Gender", selector: (r) => r.gender || "-", width: "90px" },
    { name: "Enrollment Status", selector: (r) => r.EnrollmentStatus || r.enrollment_status || "-", width: "140px" },
  ];

  const customStyles = {
    headCells: { style: { fontWeight: "bold", fontSize: "13px" } },
    rows: { style: { fontSize: "13px" } },
  };

  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />
      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0,
          transition: "margin-left 0.3s",
          minWidth: 0,
        }}
      >
        <Navbar
          user={user}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />
        <div className="flex-grow-1 p-4 overflow-auto">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="mb-1">Masterlist</h4>
              <p className="text-muted small mb-0">
                Student enrollment data from SIS/Registrar, grouped by section.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={fetchMasterlist}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Loading...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2" />
                  Refresh
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {error}
            </div>
          )}

          {!error && !loading && sections.length === 0 && (
            <div className="alert alert-info">No masterlist data available.</div>
          )}

          {!error && sections.length > 0 && (
            <div className="mb-3 text-muted small">
              Total: <strong>{total}</strong> students across <strong>{sections.length}</strong> sections
            </div>
          )}

          {sections.map((sec) => {
            const isExpanded = expandedSection === sec.section_key;
            const headerLabel = `${sec.course || "Course"} · ${sec.year_level || ""} · Section ${sec.section}`.replace(/\s·\s+/g, " · ").replace(/^ · | · $/g, "").trim();

            return (
              <div
                key={sec.section_key}
                className={`card mb-3 ${darkMode ? "bg-dark border-secondary" : ""}`}
              >
                <div
                  className={`card-header d-flex justify-content-between align-items-center py-2 px-3 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSection(sec.section_key)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className={`bi bi-chevron-${isExpanded ? "down" : "right"} small`} />
                    <span className="fw-semibold">{headerLabel}</span>
                    <span className="badge bg-primary">{sec.count} students</span>
                    {sec.academic_year && (
                      <span className="badge bg-secondary">{sec.academic_year} · {sec.semester}</span>
                    )}
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => openScheduleModal(sec, e)}
                    title="Schedule Section"
                  >
                    <i className="bi bi-calendar-plus me-1" />
                    Schedule Section
                  </Button>
                </div>
                {isExpanded && (
                  <div className="card-body p-0">
                    <DataTable
                      columns={studentColumns}
                      data={sec.students || []}
                      dense
                      striped
                      highlightOnHover
                      pagination
                      paginationPerPage={20}
                      paginationRowsPerPageOptions={[10, 20, 50]}
                      customStyles={customStyles}
                      theme={darkMode ? "dark" : "default"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Footer darkMode={darkMode} />
      </div>

      {/* Schedule Section Modal */}
      <Modal show={scheduleModalOpen} onHide={closeScheduleModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Schedule Section</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scheduleDataLoading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 mb-0 text-muted small">Loading classes, rooms, subjects...</p>
            </div>
          )}
          {scheduleSection && !scheduleDataLoading && (
            <>
              <div className="mb-3 p-2 rounded bg-light">
                <small className="text-muted">Section:</small>
                <strong className="ms-2">{scheduleSection.course || "—"} · {scheduleSection.year_level || "—"} · Section {scheduleSection.section || "—"}</strong>
              </div>
              <Form onSubmit={saveScheduleSection}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <Form.Label>Class</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Select
                        value={scheduleForm.class_id}
                        onChange={(e) => setScheduleForm((f) => ({ ...f, class_id: e.target.value }))}
                      >
                        <option value="">Select or create class</option>
                        {scheduleClasses.map((c) => (
                          <option key={c.id} value={c.id}>{c.course} {c.level}-{c.section}</option>
                        ))}
                      </Form.Select>
                      <Button variant="outline-secondary" onClick={createClassFromSection} title="Create class from section">
                        <i className="bi bi-plus-lg" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <Form.Label>Room</Form.Label>
                    <Form.Select
                      value={scheduleForm.room_id}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, room_id: e.target.value }))}
                    >
                      <option value="">Select room</option>
                      {scheduleRooms.map((r) => (
                        <option key={r.id} value={r.id} disabled={r.status === "Inactive" || r.status === "Under Renovation"}>
                          {r.room_code || r.room_number || r.id} - {r.room_name} ({r.status || "Active"})
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <Form.Label className="mb-0">Subjects & schedule</Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={addSubjectRow}>
                    <i className="bi bi-plus me-1" /> Add subject
                  </Button>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Day</th>
                        <th>Start</th>
                        <th>End</th>
                        <th width="50" />
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleForm.subjectRows.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <Form.Select
                              size="sm"
                              value={row.subject_id}
                              onChange={(e) => updateSubjectRow(idx, "subject_id", e.target.value)}
                            >
                              <option value="">Select</option>
                              {scheduleSubjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={row.teacher_id}
                              onChange={(e) => updateSubjectRow(idx, "teacher_id", e.target.value)}
                            >
                              <option value="">Select</option>
                              {scheduleTeachers.map((u) => (
                                <option key={u.id} value={u.id}>{teacherLabel(u)}</option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={row.day}
                              onChange={(e) => updateSubjectRow(idx, "day", e.target.value)}
                            >
                              {DAYS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              size="sm"
                              value={row.start_time}
                              onChange={(e) => updateSubjectRow(idx, "start_time", e.target.value)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              size="sm"
                              value={row.end_time}
                              onChange={(e) => updateSubjectRow(idx, "end_time", e.target.value)}
                            />
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="p-1"
                              onClick={() => removeSubjectRow(idx)}
                              disabled={scheduleForm.subjectRows.length <= 1}
                              title="Remove"
                            >
                              <i className="bi bi-trash" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeScheduleModal}>Cancel</Button>
          <Button variant="primary" onClick={saveScheduleSection} disabled={scheduleSaving || scheduleDataLoading}>
            {scheduleSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>Save Schedules</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
    </div>
  );
}

export default Masterlist;
