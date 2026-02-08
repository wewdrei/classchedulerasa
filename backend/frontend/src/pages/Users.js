import React, { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiFetch } from "../utils/api";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import { default as DataTable } from "react-data-table-component";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";

const initialUsers = [];

function UsersManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
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
    middle_name: "",
    last_name: "",
    email: "",
    role: "",
    password: "",
    profile: null,
  });

  // Preview URL for Add Modal image preview
  const [addPreview, setAddPreview] = useState(null);
  // Preview URL for Edit Modal
  const [editPreview, setEditPreview] = useState(null);
  const [editPreviewObject, setEditPreviewObject] = useState(false);

  // Inline validation state for Add modal
  const [addErrors, setAddErrors] = useState({});
  const [isAddValid, setIsAddValid] = useState(false);

  // Helper: resolve profile value to an image src usable in <img>
  const resolveProfileSrc = (profile) => {
    if (!profile) return null;
    // data URL -> use as-is
    if (typeof profile === 'string' && profile.startsWith('data:')) return profile;
    // absolute URL (http(s) or protocol-relative)
    if (typeof profile === 'string' && (profile.startsWith('http') || profile.startsWith('//'))) return profile;

    // Determine backend origin: prefer REACT_APP_API_URL if it's a full URL, otherwise fallback to window.location.origin
    let origin = window.location.origin;
    try {
      if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.startsWith('http')) {
        origin = new URL(process.env.REACT_APP_API_URL).origin;
      }
    } catch (e) {
      origin = window.location.origin;
    }

    const p = (typeof profile === 'string') ? profile.trim() : profile;
    // If already an absolute storage path returned by Storage::url (e.g. '/storage/uploads/...')
    if (p.startsWith('/')) return origin + p;
    // If it starts with 'storage/' (no leading slash)
    if (p.startsWith('storage/')) return origin + '/' + p;
    // If it's a storage-relative filename like 'profiles/...' or 'uploads/...', prefix with /storage/
    return origin + '/storage/' + p.replace(/^\/+/, '');
  };

  // Image cell component to gracefully degrade when image fails
  const ProfileImage = ({ profile, name, size = 32 }) => {
    const [broken, setBroken] = useState(false);
    useEffect(() => {
      setBroken(false);
    }, [profile]);
    if (!profile) return <span className="text-muted">No Image</span>;
    if (broken) return <span className="text-muted">No Image</span>;
    const src = resolveProfileSrc(profile);
    return (
      <img
        src={src}
        alt={name || 'profile'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setBroken(true)}
      />
    );
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiFetch("select", {
          method: "POST",
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
  const validateAddForm = () => {
    const errors = {};
    if (!formData.first_name || formData.first_name.trim() === '') errors.first_name = 'First name is required.';
    if (!formData.last_name || formData.last_name.trim() === '') errors.last_name = 'Last name is required.';
    if (!formData.email || formData.email.trim() === '') errors.email = 'Email is required.';
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) errors.email = 'Please enter a valid email address.';
      else if (users.some((u) => u.email && u.email.toLowerCase() === formData.email.toLowerCase())) errors.email = 'A user with this email already exists.';
    }
    if (!formData.role || formData.role.trim() === '') errors.role = 'Role is required.';
    if (!formData.password || formData.password.trim() === '') errors.password = 'Password is required.';
    else {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
      if (!strongPasswordRegex.test(formData.password)) errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.';
    }
    if (formData.profile && typeof formData.profile !== 'string') {
      const file = formData.profile;
      if (!file.type.startsWith('image/')) errors.profile = 'Profile must be an image file.';
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) errors.profile = 'Profile image must be less than 2MB.';
    }
    return errors;
  };

  useEffect(() => {
    const errs = validateAddForm();
    setAddErrors(errs);
    setIsAddValid(Object.keys(errs).length === 0);
  }, [formData, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const errs = validateAddForm();
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return; // inline validation will show messages

    try {
      let profileUrl = '';
      if (formData.profile) {
        const fd = new FormData();
        fd.append('file', formData.profile);
        const uploadRes = await fetch(process.env.REACT_APP_API_URL + 'upload', {
          method: 'POST',
          body: fd,
        });
        const uploadData = await uploadRes.json();
        console.log('Users.js: upload response (add)', uploadData);
        if (uploadData && uploadData.success && uploadData.paths) {
          const paths = uploadData.paths;
          if (Array.isArray(paths) && paths.length > 0) {
            profileUrl = paths[0];
          } else if (paths.file) {
            profileUrl = Array.isArray(paths.file) ? paths.file[0] : paths.file;
          } else {
            const keys = Object.keys(paths);
            if (keys.length > 0) {
              const val = paths[keys[0]];
              profileUrl = Array.isArray(val) ? val[0] : val;
            }
          }
          if (!profileUrl) console.warn('Users.js: could not derive uploaded file path (add)', uploadData);
        } else {
          console.warn('Users.js: upload did not return expected paths structure (add)', uploadData);
        }
      }

      // Insert user
      const response = await apiFetch('insert', {
        method: 'POST',
        body: JSON.stringify({
          table: 'users',
          data: { ...formData, profile: profileUrl },
        }),
      }, true);

      const result = await response.json();
      if (result.success) {
        Swal.fire('Success', 'User added successfully!', 'success');
        // Refetch users
        const res = await apiFetch('select', {
          method: 'POST',
          body: JSON.stringify({ table: 'users' }),
        });
        const data = await res.json();
        setUsers(data.data || []);
        closeAddModal();
      } else {
        Swal.fire('Error', result.message || 'Failed to add user.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to add user.', 'error');
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
        console.log('Users.js: upload response (edit)', uploadData);
        if (uploadData && uploadData.success && uploadData.paths) {
          const paths = uploadData.paths;
          if (Array.isArray(paths) && paths.length > 0) {
            profileUrl = paths[0];
          } else if (paths.file) {
            profileUrl = Array.isArray(paths.file) ? paths.file[0] : paths.file;
          } else {
            const keys = Object.keys(paths);
            if (keys.length > 0) {
              const val = paths[keys[0]];
              profileUrl = Array.isArray(val) ? val[0] : val;
            }
          }
          if (!profileUrl) console.warn('Users.js: could not derive uploaded file path (edit)', uploadData);
        } else {
          console.warn('Users.js: upload did not return expected paths structure (edit)', uploadData);
        }
      }

      // ✅ Build update data
      const updateData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
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
      const response = await apiFetch("update", {
        method: "POST",
        body: JSON.stringify({
          table: "users",
          conditions: { id: editUserId },
          data: updateData,
        }),
      }, true);

      const result = await response.json();
      console.log('Users.js: update response', result);
      // Treat explicit success
      if (result.success) {
        Swal.fire("Success", "User updated successfully!", "success");
        // Refetch users
        const res = await apiFetch("select", {
          method: "POST",
          body: JSON.stringify({ table: "users" }),
        });
        const data = await res.json();
        console.log('Users.js: refreshed users after update', data);
        setUsers(data.data || []);
        // If the edited user is the currently logged-in user, update sessionStorage
        try {
          const currentEmail = sessionStorage.getItem('email');
          if (currentEmail) {
            const updated = (data.data || []).find(u => u.id === editUserId || (u.email && u.email === updateData.email));
            if (updated && updated.email === currentEmail) {
              // update relevant sessionStorage keys so account/profile views refresh
              sessionStorage.setItem('first_name', updated.first_name || '');
              sessionStorage.setItem('last_name', updated.last_name || '');
              sessionStorage.setItem('email', updated.email || '');
              sessionStorage.setItem('profile', updated.profile || '');
              console.log('Users.js: updated sessionStorage for current user', updated.profile);
            }
          }
        } catch (e) {
          console.warn('Users.js: failed to update sessionStorage after edit', e);
        }
        closeEditModal();
      } else if (result.message && typeof result.message === 'string' && result.message.toLowerCase().includes('no records updated')) {
        // Backend reported zero rows affected. This is not fatal — it usually
        // means the submitted data matched existing values. Treat as a soft
        // success so the UI doesn't show an error when nothing changed.
        Swal.fire("Notice", "No changes were made.", "info");
        // Still refresh list to ensure UI is up-to-date
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "users" }),
        });
        const data = await res.json();
        console.log('Users.js: refreshed users after no-op update', data);
        setUsers(data.data || []);
        try {
          const currentEmail = sessionStorage.getItem('email');
          if (currentEmail) {
            const updated = (data.data || []).find(u => u.id === editUserId || (u.email && u.email === updateData.email));
            if (updated && updated.email === currentEmail) {
              sessionStorage.setItem('first_name', updated.first_name || '');
              sessionStorage.setItem('last_name', updated.last_name || '');
              sessionStorage.setItem('email', updated.email || '');
              sessionStorage.setItem('profile', updated.profile || '');
            }
          }
        } catch (e) { /* ignore */ }
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
      const response = await apiFetch("delete", {
        method: "POST",
        body: JSON.stringify({
          table: "users",
          conditions: { id: deleteUserId },
        }),
      }, true);
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "User deleted successfully.", "success");
        // Refetch users
        const res = await apiFetch("select", {
          method: "POST",
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
    setFormData({ first_name: "", middle_name: "", last_name: "", email: "", role: "", password: "", profile: null });
    // reset preview
    if (addPreview) {
      URL.revokeObjectURL(addPreview);
    }
    setAddPreview(null);
    setAddErrors({});
    setShowAddModal(true);
  };
  const openEditModal = (id) => {
    const user = users.find((u) => u.id === id);
    // cleanup previous preview if it was an object URL
    if (editPreviewObject && editPreview) {
      try { URL.revokeObjectURL(editPreview); } catch (err) { }
    }
    // set form data
    setFormData({
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || "",
      password: "",
      profile: user.profile || null,
    });
    // set edit preview - if profile is a string, resolve to URL (external), else null
    if (user.profile && typeof user.profile === 'string') {
      setEditPreview(resolveProfileSrc(user.profile));
      setEditPreviewObject(false);
    } else {
      setEditPreview(null);
      setEditPreviewObject(false);
    }
    setEditUserId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteUserId(id);
    setShowDeleteModal(true);
  };
  const closeAddModal = () => {
    // revoke preview URL if any
    if (addPreview) {
      try {
        URL.revokeObjectURL(addPreview);
      } catch (e) {
        /* ignore */
      }
    }
    setAddPreview(null);
    setFormData({ first_name: "", middle_name: "", last_name: "", email: "", role: "", password: "", profile: null });
    setAddErrors({});
    setIsAddValid(false);
    setShowAddModal(false);
  };
  const closeEditModal = () => {
    if (editPreviewObject && editPreview) {
      try { URL.revokeObjectURL(editPreview); } catch (err) { }
    }
    setEditPreview(null);
    setEditPreviewObject(false);
    setShowEditModal(false);
  };
  const closeDeleteModal = () => setShowDeleteModal(false);

  // Dark mode/sidebar
  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  // Filtered data
  const filteredData = users.filter(
    (item) =>
      (item.first_name && item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.middle_name && item.middle_name.toLowerCase().includes(filterText.toLowerCase())) ||
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
      cell: (row) => <ProfileImage profile={row.profile} name={`${row.first_name || ''} ${row.middle_name || ''} ${row.last_name || ''}`} size={32} />,
      center: true,
      width: "80px",
    },
    {
      name: "First Name",
      selector: (row) => row.first_name,
      sortable: true,
    },
    {
      name: "Middle Name",
      selector: (row) => row.middle_name || "",
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
      name: "Department",
      selector: (row) => row.department || "N/A",
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => {
        const r = row.role ? row.role.toUpperCase() : "";
        if (r === "SUPERADMIN") return "Super Admin";
        if (r === "ADMIN") return "Admin"; // Or "Staff" if preferred, but keeping consistent with sidebar change to Admin if applicable, or existing user data.
        return row.role;
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex justify-content-center action-cell">
          <button
            className="btn btn-sm btn-outline-primary icon-btn"
            title="Edit"
            onClick={() => openEditModal(row.id)}
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger icon-btn ms-2"
            title="Delete"
            onClick={() => openDeleteModal(row.id)}
          >
            <i className="bi bi-trash"></i>
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
      className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"
        } overflow-hidden`}
    >
      <Sidebar collapsed={collapsed} />
      <div className={`d-flex flex-column flex-grow-1 main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          user={user}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />
        <div className="flex-grow-1 p-4">
          <h4 className="mb-3">Users Management</h4>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search users..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button className="btn btn-success ms-3" onClick={openAddModal}>
              <i className="bi bi-plus me-1"></i> Add User
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
                      {addErrors.first_name && <div className="text-danger small mt-1">{addErrors.first_name}</div>}
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.middle_name}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
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
                      {addErrors.last_name && <div className="text-danger small mt-1">{addErrors.last_name}</div>}
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
                      {addErrors.email && <div className="text-danger small mt-1">{addErrors.email}</div>}
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
                      {addErrors.role && <div className="text-danger small mt-1">{addErrors.role}</div>}
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
                      {addErrors.password && <div className="text-danger small mt-1">{addErrors.password}</div>}
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Profile Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // revoke previous preview
                            if (addPreview) {
                              try { URL.revokeObjectURL(addPreview); } catch (err) { }
                            }
                            setFormData({ ...formData, profile: file });
                            setAddPreview(URL.createObjectURL(file));
                          } else {
                            if (addPreview) {
                              try { URL.revokeObjectURL(addPreview); } catch (err) { }
                            }
                            setFormData({ ...formData, profile: null });
                            setAddPreview(null);
                          }
                        }}
                      />
                      {addPreview && (
                        <div className="mt-2">
                          <img src={addPreview} alt="preview" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
                        </div>
                      )}
                      {addErrors.profile && <div className="text-danger small mt-1">{addErrors.profile}</div>}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={!isAddValid}>
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
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.middle_name}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
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
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // revoke previous preview if it was an object URL
                            if (editPreviewObject && editPreview) {
                              try { URL.revokeObjectURL(editPreview); } catch (err) { }
                            }
                            setFormData({ ...formData, profile: file });
                            setEditPreview(URL.createObjectURL(file));
                            setEditPreviewObject(true);
                          }
                        }}
                      />
                      {editPreview && (
                        <div className="mt-2">
                          <img src={editPreview} alt="preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: 'cover' }} />
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
