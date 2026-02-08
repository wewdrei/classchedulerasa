import React, { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiFetch } from "../utils/api";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

function RoomsManagement() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editRoomId, setEditRoomId] = useState(null);
  const [deleteRoomId, setDeleteRoomId] = useState(null);

  // Form: room_name, room_code, campus_building, room_type, capacity, status
  const [formData, setFormData] = useState({
    room_name: "",
    room_code: "",
    campus_building: "",
    room_type: "",
    capacity: "",
    status: "Active",
  });

  // Fetch rooms
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await apiFetch("rooms");
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : (data?.data ? data.data : []));
    } catch {
      setRooms([]);
    }
  };

  // Add room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch("rooms", {
        method: "POST",
        body: JSON.stringify({
          room_name: formData.room_name,
          room_code: formData.room_code,
          campus_building: formData.campus_building,
          room_type: formData.room_type,
          capacity: Number(formData.capacity) || 0,
          status: formData.status,
        }),
      });

      if (response.ok) {
        Swal.fire("Success", "Room added successfully!", "success");
        fetchRooms();
        closeAddModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to add room.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to add room.", "error");
    }
  };

  // Edit room
  const handleEditRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch("rooms/" + editRoomId, {
        method: "PUT",
        body: JSON.stringify({
          room_name: formData.room_name,
          room_code: formData.room_code,
          campus_building: formData.campus_building,
          room_type: formData.room_type,
          capacity: Number(formData.capacity) || 0,
          status: formData.status,
        }),
      });

      if (response.ok) {
        Swal.fire("Success", "Room updated successfully!", "success");
        fetchRooms();
        closeEditModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to update room.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to update room.", "error");
    }
  };

  // Delete room
  const handleDeleteRoom = async () => {
    try {
      const response = await apiFetch("rooms/" + deleteRoomId, { method: "DELETE" });

      if (response.ok) {
        Swal.fire("Deleted!", "Room deleted successfully.", "success");
        fetchRooms();
        closeDeleteModal();
      } else {
        const result = await response.json();
        Swal.fire("Error", result.message || "Failed to delete room.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to delete room.", "error");
    }
  };

  // Modal open/close
  const openAddModal = () => {
    setFormData({
      room_name: "",
      room_code: "",
      campus_building: "",
      room_type: "",
      capacity: "",
      status: "Active"
    });
    setShowAddModal(true);
  };
  const openEditModal = (id) => {
    const room = rooms.find((r) => r.id === id);
    setFormData({
      room_name: room.room_name || "",
      room_code: room.room_code || "",
      campus_building: room.campus_building || "",
      room_type: room.room_type || "",
      capacity: String(room.capacity ?? ""),
      status: normalizeStatus(room.status),
    });
    setEditRoomId(id);
    setShowEditModal(true);
  };
  const openDeleteModal = (id) => {
    setDeleteRoomId(id);
    setShowDeleteModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);
  const closeEditModal = () => setShowEditModal(false);
  const closeDeleteModal = () => setShowDeleteModal(false);

  // Dark mode/sidebar
  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  // Filtered data
  const filteredData = rooms.filter(
    (item) =>
      (item.room_name && item.room_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.room_code && item.room_code.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.campus_building && item.campus_building.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.room_type && item.room_type.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.capacity !== undefined && String(item.capacity).includes(filterText)) ||
      (item.status !== undefined && String(item.status).includes(filterText))
  );
  const columns = [
    {
      name: "#",
      selector: (row, idx) => idx + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Room Name",
      selector: (row) => row.room_name || "-",
      sortable: true,
    },
    {
      name: "Room Code",
      selector: (row) => row.room_code || "-",
      sortable: true,
    },
    {
      name: "Campus Building",
      selector: (row) => row.campus_building || "-",
      sortable: true,
    },
    {
      name: "Room Type",
      selector: (row) => row.room_type || "-",
      sortable: true,
    },
    {
      name: "Capacity",
      selector: (row) => row.capacity || "-",
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => normalizeStatus(row.status),
      sortable: true,
      cell: (row) => {
        const status = normalizeStatus(row.status);
        let badgeClass = "bg-secondary";
        if (status === "Active") badgeClass = "bg-success";
        else if (status === "Inactive") badgeClass = "bg-danger";
        else if (status === "Under Renovation") badgeClass = "bg-warning text-dark";
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      }
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

    // Bestlink College of the Philippines - campus buildings & room types
  const CAMPUS_BUILDINGS = [
    "Main Building",
    "Dr. Carino Hall",
    "Vicente Building",
    "San Agustin Building",
  ];
  const ROOM_TYPES = [
    "Lecture Hall",
    "Computer Lab",
    "Science Laboratory",
    "AVR",
    "Library",
    "Faculty Room",
    "Office",
    "Laboratory",
    "Multi-Purpose Hall",
  ];
  const normalizeStatus = (s) => {
    if (s === 0 || s === "0") return "Active";
    if (s === 1 || s === "1") return "Inactive";
    return s || "Active";
  };

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
          <div className="mb-3">
            <h4 className="mb-1">Rooms Management</h4>
            <p className="text-muted small mb-0">Bestlink College of the Philippines — Main, MV & San Agustin Campuses</p>
          </div>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search rooms..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button className="btn btn-success ms-3" onClick={openAddModal}>
              <i className="bi bi-plus me-1"></i> Add Room
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
      </div>
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />

      {/* Add Modal */}
      {showAddModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeAddModal}></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" onClick={closeAddModal}>
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleAddRoom}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Room</h5>
                    <button type="button" className="btn-close" onClick={closeAddModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Room Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.room_name}
                        onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Room Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.room_code}
                        onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Campus Building</label>
                      <select
                        className="form-control"
                        value={formData.campus_building}
                        onChange={(e) => setFormData({ ...formData, campus_building: e.target.value })}
                        required
                      >
                        <option value="">Select building</option>
                        {formData.campus_building && !CAMPUS_BUILDINGS.includes(formData.campus_building) && (
                          <option value={formData.campus_building}>{formData.campus_building}</option>
                        )}
                        {CAMPUS_BUILDINGS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Room Type</label>
                      <select
                        className="form-control"
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                        required
                      >
                        <option value="">Select type</option>
                        {formData.room_type && !ROOM_TYPES.includes(formData.room_type) && (
                          <option value={formData.room_type}>{formData.room_type}</option>
                        )}
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Under Renovation">Under Renovation</option>
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
              <form onSubmit={handleEditRoom}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Room</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Room Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.room_name}
                        onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Room Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.room_code}
                        onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Campus Building</label>
                      <select
                        className="form-control"
                        value={formData.campus_building}
                        onChange={(e) => setFormData({ ...formData, campus_building: e.target.value })}
                        required
                      >
                        <option value="">Select building</option>
                        {formData.campus_building && !CAMPUS_BUILDINGS.includes(formData.campus_building) && (
                          <option value={formData.campus_building}>{formData.campus_building}</option>
                        )}
                        {CAMPUS_BUILDINGS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Room Type</label>
                      <select
                        className="form-control"
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                        required
                      >
                        <option value="">Select type</option>
                        {formData.room_type && !ROOM_TYPES.includes(formData.room_type) && (
                          <option value={formData.room_type}>{formData.room_type}</option>
                        )}
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Under Renovation">Under Renovation</option>
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
                  <h5 className="modal-title">Delete Room</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete this room?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteRoom}>
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

export default RoomsManagement;
