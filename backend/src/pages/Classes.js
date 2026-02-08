import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const initialClasses = [];

function ClassesManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [classes, setClasses] = useState(initialClasses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editClassId, setEditClassId] = useState(null);
  const [deleteClassId, setDeleteClassId] = useState(null);

  // Form: section, level, course
  const [formData, setFormData] = useState({
    section: "",
    level: "",
    course: "",
  });

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setClasses(result.data);
        }
      } catch (error) {
        setClasses([]);
      }
    };
    fetchClasses();
  }, []);

  // Add class
  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "class",
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Class added successfully!", "success");
        // Refetch classes
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const data = await res.json();
        setClasses(data.data || []);
        closeAddModal();
      } else {
        Swal.fire("Error", result.message || "Failed to add class.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to add class.", "error");
    }
  };

  // Edit class
  const handleEditClass = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "class",
          conditions: { id: editClassId },
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Class updated successfully!", "success");
        // Refetch classes
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const data = await res.json();
        setClasses(data.data || []);
        closeEditModal();
      } else {
        Swal.fire("Error", result.message || "Failed to update class.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to update class.", "error");
    }
  };

  // Delete class
  const handleDeleteClass = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "class",
          conditions: { id: deleteClassId },
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "Class deleted successfully.", "success");
        // Refetch classes
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const data = await res.json();
        setClasses(data.data || []);
        closeDeleteModal();
      } else {
        Swal.fire("Error", result.message || "Failed to delete class.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to delete class.", "error");
    }
  };

  // Modal open/close
  const openAddModal = () => {
    setFormData({ section: "", level: "", course: "" });
    setShowAddModal(true);
  };
  const openEditModal = (id) => {
    const cls = classes.find((c) => c.id === id);
    setFormData({
      section: cls.section || "",
      level: cls.level || "",
      course: cls.course || "",
    });
    setEditClassId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteClassId(id);
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
  const filteredData = classes.filter(
    (item) =>
      (item.section && item.section.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.level && item.level.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.course && item.course.toLowerCase().includes(filterText.toLowerCase()))
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
      name: "Section",
      selector: (row) => row.section,
      sortable: true,
    },
    {
      name: "Level",
      selector: (row) => row.level,
      sortable: true,
    },
    {
      name: "Course",
      selector: (row) => row.course,
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

  // derive unique course options from existing classes to populate the dropdown
  const courseOptions = Array.from(
    new Set(classes.map((c) => c.course).filter(Boolean))
  );

  return (
    <div
      className={`d-flex min-vh-100 ${
        darkMode ? "bg-dark text-white" : "bg-light"
      } overflow-hidden`}
    >
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
          <h2>Classes Management</h2>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search classes..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button className="btn btn-success ms-3" onClick={openAddModal}>
              <i className="fa fa-plus me-1"></i> Add Class
            </button>
          </div>
          <DataTable
            columns={columns}
            data={filteredData}
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

      {/* Add Modal */}
      {showAddModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeAddModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeAddModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleAddClass}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Class</h5>
                    <button type="button" className="btn-close" onClick={closeAddModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Section</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Level</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Course</label>
                      <select
                        className="form-control"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        required
                      >
                        <option value="">Select course</option>
                        {courseOptions.map((c, idx) => (
                          <option key={idx} value={c}>
                            {c}
                          </option>
                        ))}
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
              <form onSubmit={handleEditClass}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Class</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Section</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Level</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Course</label>
                      <select
                        className="form-control"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        required
                      >
                        <option value="">Select course</option>
                        {courseOptions.map((c, idx) => (
                          <option key={idx} value={c}>
                            {c}
                          </option>
                        ))}
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
                  <h5 className="modal-title">Delete Class</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete this class?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteClass}>
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

export default ClassesManagement;
