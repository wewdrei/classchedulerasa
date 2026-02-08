import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";

// Helper for date formatting
function formatLoggedAt(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  // Format: July 24, 2024 05:12PM
  const formatted = date.toLocaleString("en-US", options)
    .replace(",", "") // Remove comma after day
    .replace(/(\d{2}):(\d{2}) (\w{2})/, (m, h, min, ampm) => `${h}:${min}${ampm}`);
  return formatted;
}

function LogsPage() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState({}); // user_id -> first_name

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "logs" }),
        });
        const data = await res.json();
        setLogs(data.data || []);
      } catch {
        setLogs([]);
      }
    };
    fetchLogs();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "users" }),
        });
        const data = await res.json();
        // Map user_id to first_name
        const map = {};
        (data.data || []).forEach((u) => {
          map[u.id] = u.first_name;
        });
        setUsers(map);
      } catch {
        setUsers({});
      }
    };
    fetchUsers();
  }, []);

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
  const filteredData = logs.filter(
    (item) =>
      (users[item.user_id] && users[item.user_id].toLowerCase().includes(filterText.toLowerCase())) ||
      (item.action && item.action.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.table_name && item.table_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.record_id && String(item.record_id).includes(filterText)) ||
      (item.message && item.message.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.created_at && formatLoggedAt(item.created_at).toLowerCase().includes(filterText.toLowerCase()))
  );

  const columns = [
    {
      name: "User Name",
      selector: (row) => users[row.user_id] || row.user_id,
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => row.action,
      sortable: true,
    },
    {
      name: "Table Name",
      selector: (row) => row.table_name,
      sortable: true,
    },
    {
      name: "Record ID",
      selector: (row) => row.record_id,
      sortable: true,
    },
    {
      name: "Message",
      selector: (row) => row.message,
      sortable: true,
      grow: 2,
    },
    {
      name: "Logged At",
      selector: (row) => formatLoggedAt(row.created_at),
      sortable: true,
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
          <h2>Logs</h2>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <input
              type="text"
              placeholder="Search logs..."
              className="form-control w-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
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
    </div>
  );
}

export default LogsPage;
