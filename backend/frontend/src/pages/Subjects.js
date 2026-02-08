import React, { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiFetch } from "../utils/api";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

function SubjectsManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);


  // Matches DB columns: class_id, subject_name, subject_code, year_level, semester, units
  const [formData, setFormData] = useState({
    class_id: "",
    subject_name: "",
    subject_code: "",
    year_level: "",
    semester: "1st",
    units: "",
  });

  const [addFormData, setAddFormData] = useState({
    class_id: "",
    subject_name: "",
    subject_code: "",
    year_level: "",
    semester: "1st",
    units: "",
  });
  // derived per-view subjects are computed inline where needed

  // Fetch classes and subjects
  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiFetch("select", {
        method: "POST",
        body: JSON.stringify({ table: "class" }),
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiFetch("subjects");
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  // Add subject (for currently viewed program)
  const openAddSubjectModal = () => {
    setAddFormData({
      class_id: "",
      subject_name: "",
      subject_code: "",
      year_level: "",
      semester: "1st",
      units: "",
    });
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  const handleAddSubject = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: addFormData.class_id ? Number(addFormData.class_id) : null,
          subject_name: addFormData.subject_name,
          subject_code: addFormData.subject_code,
          year_level: addFormData.year_level ? Number(addFormData.year_level) : null,
          semester: addFormData.semester,
          units: addFormData.units ? Number(addFormData.units) : 0,
        }),
      });

      if (response.ok) {
        Swal.fire("Success", "Subject added successfully!", "success");
        fetchSubjects();
        closeAddModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to add subject.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Failed to add subject.", "error");
    }
  };

  // Edit subject
  const handleEditSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch("subjects/" + editSubjectId, {
        method: "PUT",
        body: JSON.stringify({
          class_id: formData.class_id ? Number(formData.class_id) : null,
          subject_name: formData.subject_name,
          subject_code: formData.subject_code,
          year_level: formData.year_level ? Number(formData.year_level) : null,
          semester: formData.semester,
          units: formData.units ? Number(formData.units) : 0,
        }),
      });

      if (response.ok) {
        Swal.fire("Success", "Subject updated successfully!", "success");
        fetchSubjects();
        closeEditModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to update subject.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to update subject.", "error");
    }
  };

  // Delete subject
  const handleDeleteSubject = async () => {
    try {
      const response = await apiFetch("subjects/" + deleteSubjectId, { method: "DELETE" });

      if (response.ok) {
        Swal.fire("Deleted!", "Subject deleted successfully.", "success");
        fetchSubjects();
        closeDeleteModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to delete subject.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to delete subject.", "error");
    }
  };

  const openEditModal = (id) => {
    const subj = subjects.find((s) => s.id === id);
    setFormData({
      class_id: subj.class_id ? String(subj.class_id) : "",
      subject_name: subj.subject_name || "",
      subject_code: subj.subject_code || "",
      year_level: subj.year_level ? String(subj.year_level) : "",
      semester: subj.semester ? String(subj.semester) : "1st",
      units: subj.units ? String(subj.units) : "",
    });
    setEditSubjectId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteSubjectId(id);
    setShowDeleteModal(true);
  };
  const openViewModal = (id) => {
    const subj = subjects.find((s) => s.id === id);
    setFormData({
      class_id: subj.class_id ? String(subj.class_id) : "",
      subject_name: subj.subject_name || "",
      subject_code: subj.subject_code || "",
      year_level: subj.year_level ? String(subj.year_level) : "",
      semester: subj.semester ? String(subj.semester) : "1st",
      units: subj.units ? String(subj.units) : "",
    });
    setEditSubjectId(id); // reusing this state or could create viewSubjectId
    setShowViewModal(true);
  };

  const closeEditModal = () => setShowEditModal(false);
  const closeViewModal = () => setShowViewModal(false);
  const closeDeleteModal = () => setShowDeleteModal(false);

  // Dark mode/sidebar
  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  // Filtered data is computed inline where required

  // Table columns
  const columns = [
    {
      name: "#",
      selector: (row, idx) => idx + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Class",
      selector: (row) => {
        const p = classes.find((c) => c.id === row.class_id);
        return p ? `${p.section} - ${p.level} - ${p.course}` : (row.class_id ?? "-");
      },
      sortable: true,
    },
    {
      name: "Subject Name",
      selector: (row) => row.subject_name || "-",
      sortable: true,
    },
    {
      name: "Subject Code",
      selector: (row) => row.subject_code || "-",
      sortable: true,
    },
    {
      name: "Units",
      selector: (row) => row.units || "-",
      sortable: true,
      width: "80px",
    },
    {
      name: "Year Level",
      selector: (row) => row.year_level || "-",
      sortable: true,
      width: "100px",
    },
    {
      name: "Semester",
      selector: (row) => {
        if (row.semester === '1' || row.semester === '1st') return '1st Semester';
        if (row.semester === '2' || row.semester === '2nd') return '2nd Semester';
        if (row.semester === 'Summer') return 'Summer';
        return row.semester || "-";
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex justify-content-center action-cell">
          <button
            className="btn btn-sm btn-outline-info icon-btn"
            title="View"
            onClick={() => openViewModal(row.id)}
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      ),
      center: true,
    },
  ];


  const customStyles = {
    headCells: { style: { fontWeight: "bold", fontSize: "14px" } },
    rows: { style: { fontSize: "14px" } },
  };

  const filteredSubjects = subjects.filter((s) => {
    const q = filterText.toLowerCase();
    const semesterLabel = (s.semester || "").toString().toLowerCase();
    const programLabel = (() => {
      const p = classes.find((c) => c.id === s.class_id);
      return p ? `${p.section} - ${p.level} - ${p.course}`.toLowerCase() : "";
    })();
    return (
      programLabel.includes(q) ||
      (s.subject_name || "").toLowerCase().includes(q) ||
      (s.subject_code || "").toLowerCase().includes(q) ||
      (s.year_level !== null && s.year_level !== undefined && String(s.year_level).includes(filterText)) ||
      semesterLabel.includes(q)
    );
  });

  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />
      <div
        className="d-flex flex-column flex-grow-1"
        style={{ marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0, transition: "margin-left 0.3s", minWidth: 0 }}
      >
        <Navbar
          user={user}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />
        <div className="flex-grow-1 p-4">
          <h4 className="mb-3">Subjects Management</h4>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button className="btn btn-success ms-3" onClick={openAddSubjectModal}>
              <i className="bi bi-plus me-1"></i> Add Subject
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredSubjects}
            pagination
            highlightOnHover
            striped
            customStyles={customStyles}
            theme={darkMode ? "dark" : "default"}
          />
        </div>

        <Footer darkMode={darkMode} />
      </div>
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />

      {/* Add Subject Modal (per program) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeAddModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeAddModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleAddSubject}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Subject</h5>
                    <button type="button" className="btn-close" onClick={closeAddModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Class</label>
                      <select
                        className="form-control"
                        value={addFormData.class_id}
                        onChange={(e) => setAddFormData({ ...addFormData, class_id: e.target.value })}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.section} - {cls.level} - {cls.course}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addFormData.subject_name}
                        onChange={(e) => setAddFormData({ ...addFormData, subject_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Subject Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addFormData.subject_code}
                        onChange={(e) => setAddFormData({ ...addFormData, subject_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Units</label>
                      <input
                        type="number"
                        className="form-control"
                        value={addFormData.units}
                        onChange={(e) => setAddFormData({ ...addFormData, units: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Year Level</label>
                      <input
                        type="number"
                        className="form-control"
                        value={addFormData.year_level}
                        onChange={(e) => setAddFormData({ ...addFormData, year_level: e.target.value })}
                        min="1"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        value={addFormData.semester}
                        onChange={(e) => setAddFormData({ ...addFormData, semester: e.target.value })}
                        required
                      >
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* View Modal */}
      {showViewModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeViewModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeViewModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">View Subject</h5>
                  <button type="button" className="btn-close" onClick={closeViewModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label fw-bold">Class</label>
                    <p>{(() => {
                      const c = classes.find(c => String(c.id) === String(formData.class_id));
                      return c ? `${c.section} - ${c.level} - ${c.course}` : formData.class_id;
                    })()}</p>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold">Subject Name</label>
                    <p>{formData.subject_name}</p>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold">Subject Code</label>
                    <p>{formData.subject_code}</p>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold">Units</label>
                    <p>{formData.units}</p>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold">Year Level</label>
                    <p>{formData.year_level}</p>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold">Semester</label>
                    <p>{formData.semester}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeViewModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeEditModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeEditModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleEditSubject}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Subject</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Class</label>
                      <select
                        className="form-control"
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.section} - {cls.level} - {cls.course}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.subject_name}
                        onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Subject Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.subject_code}
                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Units</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.units}
                        onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Year Level</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.year_level}
                        onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                        min="1"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        required
                      >
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeDeleteModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeDeleteModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Subject</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete this subject?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteSubject}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SubjectsManagement;
