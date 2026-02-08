import React, { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import { apiFetch } from "../utils/api";

function formatLoggedAt(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-US", options)
    .replace(",", "")
    .replace(/(\d{2}):(\d{2}):(\d{2}) (\w{2})/, (m, h, min, sec, ampm) => `${h}:${min}:${sec}${ampm}`);
}

function LogsPage() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 50 });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("per_page", "50");
      if (filterText.trim()) params.set("search", filterText.trim());
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await apiFetch("audit-trail?" + params.toString());
      const data = await res.json();

      if (data.data) {
        setLogs(data.data);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total,
        });
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filterText, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchLogs(1);
  };

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const sidebarWidth = collapsed ? 80 : 250;

  const columns = [
    {
      name: "User",
      selector: (row) => row.user_name || "System",
      sortable: true,
      cell: (row) => (
        <span className={row.user_id ? "" : "text-muted"}>
          {row.user_name || "System"}
        </span>
      ),
    },
    {
      name: "Action",
      selector: (row) => row.action,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className={`badge bg-${['login'].includes(row.action) ? 'success' : ['insert','create','store'].includes(row.action) ? 'primary' : ['update'].includes(row.action) ? 'warning' : ['delete'].includes(row.action) ? 'danger' : 'secondary'}`}>
          {row.action}
        </span>
      ),
    },
    {
      name: "Resource",
      selector: (row) => row.table_name || "-",
      sortable: true,
      width: "100px",
    },
    {
      name: "Record ID",
      selector: (row) => row.record_id ?? "-",
      sortable: true,
      width: "90px",
    },
    {
      name: "Message",
      selector: (row) => row.message,
      sortable: true,
      grow: 2,
      wrap: true,
    },
    {
      name: "Logged At",
      selector: (row) => formatLoggedAt(row.created_at),
      sortable: true,
      width: "200px",
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
        <div className="flex-grow-1 p-4">
          <h4 className="mb-3">Audit Trail</h4>
          <p className="text-muted small mb-3">
            Track all user actions across the system including logins, create, update, and delete operations.
          </p>

          <form onSubmit={handleSearch} className="mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label small">Search</label>
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  className="form-control form-control-sm"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small">Action</label>
                <select
                  className="form-select form-select-sm"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="">All actions</option>
                  <option value="login">Login</option>
                  <option value="insert">Insert</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small">From date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small">To date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary btn-sm">
                  Apply
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm ms-1"
                  onClick={() => {
                    setFilterText("");
                    setActionFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          <DataTable
            columns={columns}
            data={logs}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={pagination.total}
            paginationDefaultPage={pagination.current_page}
            onChangePage={handlePageChange}
            highlightOnHover
            striped
            customStyles={customStyles}
            theme={darkMode ? "dark" : "default"}
          />
        </div>
        <Footer darkMode={darkMode} />
      </div>
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
    </div>
  );
}

export default LogsPage;
