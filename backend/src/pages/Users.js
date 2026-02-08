import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import { default as DataTable } from "react-data-table-component";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";

const initialUsers = [];

function UsersManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Form: first_name, last_name, email, role, password, profile
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    password: "",
    profile: null,
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "users" }),
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setUsers(result.data);
        }
      } catch (error) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

 // ✅ Add User
const handleAddUser = async (e) => {
  e.preventDefault();
  try {
    let profileUrl = "";

    // ✅ Validate password
    if (!formData.password || formData.password.trim() === "") {
      Swal.fire("Error", "Password is required for new users.", "error");
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

    if (!strongPasswordRegex.test(formData.password)) {
      Swal.fire(
        "Error",
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.",
        "error"
      );
      return;
    }

    // ✅ Upload profile if present
    if (formData.profile) {
      const fd = new FormData();
      fd.append("file", formData.profile);
      const uploadRes = await fetch(process.env.REACT_APP_API_URL + "upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.paths && uploadData.paths.file) {
        profileUrl = uploadData.paths.file;
      }
    }

    // ✅ Insert user
    const response = await fetch(process.env.REACT_APP_API_URL + "insert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "users",
        data: {
          ...formData,
          profile: profileUrl,
        },
      }),
    });

    const result = await response.json();
    if (result.success) {
      Swal.fire("Success", "User added successfully!", "success");
      // Refetch users
      const res = await fetch(process.env.REACT_APP_API_URL + "select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "users" }),
      });
      const data = await res.json();
      setUsers(data.data || []);
      closeAddModal();
    } else {
      Swal.fire("Error", result.message || "Failed to add user.", "error");
    }
  } catch (error) {
    Swal.fire("Error", "Failed to add user.", "error");
  }
};

// ✅ Edit User
const handleEditUser = async (e) => {
  e.preventDefault();
  try {
    let profileUrl = formData.profile;

    // ✅ Upload profile if changed (Blob, not string)
    if (formData.profile && typeof formData.profile !== "string") {
      const fd = new FormData();
      fd.append("file", formData.profile);
      const uploadRes = await fetch(process.env.REACT_APP_API_URL + "upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.paths && uploadData.paths.file) {
        profileUrl = uploadData.paths.file;
      }
    }

    // ✅ Build update data
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role: formData.role,
      profile: profileUrl,
    };

    // ✅ Validate and include password only if provided
    if (formData.password && formData.password.trim() !== "") {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

      if (!strongPasswordRegex.test(formData.password)) {
        Swal.fire(
          "Error",
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.",
          "error"
        );
        return;
      }

      updateData.password = formData.password;
    }

    // ✅ Update request
    const response = await fetch(process.env.REACT_APP_API_URL + "update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "users",
        conditions: { id: editUserId },
        data: updateData,
      }),
    });

    const result = await response.json();
    if (result.success) {
      Swal.fire("Success", "User updated successfully!", "success");
      // Refetch users
      const res = await fetch(process.env.REACT_APP_API_URL + "select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "users" }),
      });
      const data = await res.json();
      setUsers(data.data || []);
      closeEditModal();
    } else {
      Swal.fire("Error", result.message || "Failed to update user.", "error");
    }
  } catch (error) {
    Swal.fire("Error", "Failed to update user.", "error");
  }
};



  // Delete user
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "users",
          conditions: { id: deleteUserId },
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "User deleted successfully.", "success");
        // Refetch users
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "users" }),
        });
        const data = await res.json();
        setUsers(data.data || []);
        closeDeleteModal();
      } else {
        Swal.fire("Error", result.message || "Failed to delete user.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to delete user.", "error");
    }
  };

  // Modal open/close
  const openAddModal = () => {
    setFormData({ first_name: "", last_name: "", email: "", role: "", password: "", profile: null });
    setShowAddModal(true);
  };
  const openEditModal = (id) => {
    const user = users.find((u) => u.id === id);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || "",
      password: "",
      profile: user.profile || null,
    });
    setEditUserId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteUserId(id);
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
  const filteredData = users.filter(
    (item) =>
      (item.first_name && item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.last_name && item.last_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.role && item.role.toLowerCase().includes(filterText.toLowerCase()))
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
      name: "Profile",
      cell: (row) =>
        row.profile ? (
          <img
            src={
              process.env.REACT_APP_API_URL +
              "../" +
              (row.profile.startsWith("/") ? row.profile.replace(/^\//, "") : row.profile)
            }
            alt="profile"
            style={{ width: 32, height: 32, borderRadius: "50%" }}
          />
        ) : (
          <span className="text-muted">No Image</span>
        ),
      center: true,
      width: "80px",
    },
    {
      name: "First Name",
      selector: (row) => row.first_name,
      sortable: true,
    },
    {
      name: "Last Name",
      selector: (row) => row.last_name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => row.role,
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
          <h2>Users Management</h2>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search users..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button className="btn btn-success ms-3" onClick={openAddModal}>
              <i className="fa fa-plus me-1"></i> Add User
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
              <form onSubmit={handleAddUser} encType="multipart/form-data">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add User</h5>
                    <button type="button" className="btn-close" onClick={closeAddModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Role</label>
                      <select
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                        <option value="Admin">Admin</option>
                        <option value="User">User</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Profile Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, profile: e.target.files[0] })}
                      />
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
              <form onSubmit={handleEditUser} encType="multipart/form-data">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit User</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Role</label>
                      <select
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                        <option value="Admin">Admin</option>
                        <option value="User">User</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Password <span className="text-muted">(leave blank to keep unchanged)</span></label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Profile Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, profile: e.target.files[0] })}
                      />
                      {formData.profile && typeof formData.profile === "string" && (
                        <div className="mt-2">
                          <img   src={
                process.env.REACT_APP_API_URL +
                "../" +
                (formData.profile.startsWith("/") ? formData.profile.replace(/^\//, "") : formData.profile)
                  } alt="profile" style={{ width: 64, height: 64, borderRadius: "50%" }} />
                        </div>
                      )}
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
                  <h5 className="modal-title">Delete User</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete this user?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>
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

export default UsersManagement;
