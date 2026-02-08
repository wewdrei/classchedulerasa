import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

function SubjectsManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);
  const [viewSubjectsModal, setViewSubjectsModal] = useState(false);
  const [viewClassId, setViewClassId] = useState(null);
  
  const openViewSubjectsModal = (classId) => {
    setViewClassId(classId);
    setViewSubjectsModal(true);
  };
  const closeViewSubjectsModal = () => setViewSubjectsModal(false);

  const classColumns = [
    {
      name: "#",
      selector: (row, idx) => idx + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Class",
      selector: (row) => `${row.section} - ${row.level} - ${row.course}`,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="btn btn-sm btn-outline-info"
          onClick={() => openViewSubjectsModal(row.id)}
        >
          <i className="fa fa-eye me-1"></i> 
        </button>
      ),
      center: true,
    },
  ];


  const [formData, setFormData] = useState({
    class_id: "",
    subject_name: "",
    semester: "1",
  });
  const subjectsForClass = subjects.filter((s) => s.class_id === viewClassId);

  // Fetch classes and subjects
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const data = await res.json();
        setClasses(data.data || []);
      } catch {
        setClasses([]);
      }
    };
    const fetchSubjects = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "subjects" }),
        });
        const data = await res.json();
        setSubjects(data.data || []);
      } catch {
        setSubjects([]);
      }
    };
    fetchClasses();
    fetchSubjects();
  }, []);

  // Add subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "subjects",
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Subject added successfully!", "success");
        // Refetch subjects
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "subjects" }),
        });
        const data = await res.json();
        setSubjects(data.data || []);
        closeAddModal();
      } else {
        Swal.fire("Error", result.message || "Failed to add subject.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to add subject.", "error");
    }
  };

  // Edit subject
  const handleEditSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "subjects",
          conditions: { id: editSubjectId },
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Subject updated successfully!", "success");
        // Refetch subjects
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "subjects" }),
        });
        const data = await res.json();
        setSubjects(data.data || []);
        closeEditModal();
      } else {
        Swal.fire("Error", result.message || "Failed to update subject.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to update subject.", "error");
    }
  };

  // Delete subject
  const handleDeleteSubject = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "subjects",
          conditions: { id: deleteSubjectId },
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "Subject deleted successfully.", "success");
        // Refetch subjects
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "subjects" }),
        });
        const data = await res.json();
        setSubjects(data.data || []);
        closeDeleteModal();
      } else {
        Swal.fire("Error", result.message || "Failed to delete subject.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to delete subject.", "error");
    }
  };

  // Modal open/close
  const openAddModal = () => {
    setFormData({ class_id: "", subject_name: "", semester: "1" });
    setShowAddModal(true);
  };
  const openEditModal = (id) => {
    const subj = subjects.find((s) => s.id === id);
    setFormData({
      class_id: subj.class_id || "",
      subject_name: subj.subject_name || "",
      semester: subj.semester ? String(subj.semester) : "1",
    });
    setEditSubjectId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteSubjectId(id);
    setShowDeleteModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);
  const closeEditModal = () => setShowEditModal(false);
  const closeDeleteModal = () => setShowDeleteModal(false);

  // Dark mode/sidebar
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
  };
  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  // Filtered data
  const filteredData = subjects.filter(
    (item) =>
      (item.subject_name && item.subject_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.semester && String(item.semester).includes(filterText)) ||
      (item.class_id && String(item.class_id).includes(filterText))
  );

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
        const cls = classes.find((c) => c.id === row.class_id);
        return cls ? `${cls.section} - ${cls.level} - ${cls.course}` : row.class_id;
      },
      sortable: true,
    },
    {
      name: "Subject Name",
      selector: (row) => row.subject_name,
      sortable: true,
    },
    {
      name: "Semester",
      selector: (row) => (row.semester === 1 ? "First Semester" : "Second Semester"),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        
        <div className="d-flex justify-content-center">
        
          <button
            className="btn btn-sm btn-outline-primary me-2"
            title="Edit"
            onClick={() => openEditModal(row.id)}
          >
            <i className="fa fa-edit"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            title="Delete"
            onClick={() => openDeleteModal(row.id)}
          >
            <i className="fa fa-trash"></i>
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
        <div className="flex-grow-1 p-4 d-flex flex-column">
  <h2>Subjects Management</h2>
  <div className="mb-3 d-flex justify-content-between align-items-center">
    <input
      type="text"
      placeholder="Search..."
      className="form-control w-50"
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
    />
    {!viewSubjectsModal && (
      <button className="btn btn-success ms-3" onClick={openAddModal}>
        <i className="fa fa-plus me-1"></i> Add Subject
      </button>
    )}
  </div>

  {/* Show CLASS table or SUBJECTS table */}
  {!viewSubjectsModal ? (
    <DataTable
      columns={classColumns}
      data={classes.filter(
        (cls) =>
          cls.section?.toLowerCase().includes(filterText.toLowerCase()) ||
          cls.level?.toString().includes(filterText.toLowerCase()) ||
          cls.course?.toLowerCase().includes(filterText.toLowerCase())
      )}
      pagination
      highlightOnHover
      striped
      customStyles={customStyles}
      theme={darkMode ? "dark" : "default"}
    />
  ) : (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>
          Subjects for{" "}
          {classes.find((c) => c.id === viewClassId)
            ? `${classes.find((c) => c.id === viewClassId).section} - ${
                classes.find((c) => c.id === viewClassId).level
              } - ${classes.find((c) => c.id === viewClassId).course}`
            : ""}
        </h5>
        <button className="btn btn-secondary" onClick={closeViewSubjectsModal}>
          <i className="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>

      <DataTable
        columns={columns} // your subject columns
        data={subjects.filter((s) => s.class_id === viewClassId)}
        pagination
        highlightOnHover
        striped
        customStyles={customStyles}
        theme={darkMode ? "dark" : "default"}
      />
    </>
  )}
</div>

        <Footer darkMode={darkMode} />
      </div>
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />

      {/* Add Modal */}
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
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        required
                      >
                        <option value="1">First</option>
                        <option value="2">Second</option>
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
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        required
                      >
                        <option value="1">First</option>
                        <option value="2">Second</option>
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
