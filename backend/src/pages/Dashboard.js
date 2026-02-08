import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
// Import FontAwesome icons
import { 
  FaUsers, FaChalkboardTeacher, FaDoorOpen, FaCalendarAlt, FaBook, 
  FaUserShield, FaUserCog, FaDoorClosed, 
  FaClipboardList, FaClipboardCheck, FaClipboard, FaLayerGroup, FaRegStar 
} from "react-icons/fa";

function Dashboard() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Add states for each table
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const role = sessionStorage.getItem("role");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Helper function to fetch table data
    const fetchTable = async (table, setter) => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table }),
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setter(result.data);
        } else {
          setter([]);
        }
      } catch (error) {
        setter([]);
      }
    };

    fetchTable("users", setUsers);
    fetchTable("class", setClasses);
    fetchTable("rooms", setRooms);
    fetchTable("schedules", setSchedules);
    fetchTable("subjects", setSubjects);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarWidth = collapsed ? 80 : 250;

  // Statistic cards data with icons
  const stats = [
    { label: "Total Users", value: users.length, icon: <FaUsers /> },
    { label: "Total Classes", value: classes.length, icon: <FaChalkboardTeacher /> },
    { label: "Total Rooms", value: rooms.length, icon: <FaDoorOpen /> },
    { label: "Total Schedules", value: schedules.length, icon: <FaCalendarAlt /> },
    { label: "Total Subjects", value: subjects.length, icon: <FaBook /> },
    { label: "Active Rooms", value: rooms.filter(r => r.status === 0).length, icon: <FaDoorOpen /> },
    { label: "Inactive Rooms", value: rooms.filter(r => r.status === 1).length, icon: <FaDoorClosed /> },
    { label: "Regular Schedules", value: schedules.filter(s => s.type === 0).length, icon: <FaClipboardList /> },
    { label: "Special Schedules", value: schedules.filter(s => s.type === 1).length, icon: <FaClipboardCheck /> },
    { label: "Exam Schedules", value: schedules.filter(s => s.type === 2).length, icon: <FaClipboard /> },
    { label: "Assignment Schedules", value: schedules.filter(s => s.type === 3).length, icon: <FaClipboardList /> }, // replaced FaClipboardUser
    { label: "First Sem Subjects", value: subjects.filter(s => s.semester === 1).length, icon: <FaLayerGroup /> },
    { label: "Second Sem Subjects", value: subjects.filter(s => s.semester === 2).length, icon: <FaRegStar /> },
    { label: "Admins", value: users.filter(u => u.role === "Admin").length, icon: <FaUserShield /> },
    { label: "SuperAdmins", value: users.filter(u => u.role === "SuperAdmin").length, icon: <FaUserCog /> },
    // Add more as needed for 10-20 cards
  ];

  const filteredStats = role === "Admin"
    ? stats.filter(stat => stat.label.toLowerCase().includes("schedule"))
    : stats;
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
          time={time}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />

        <div className="flex-grow-1 p-4 d-flex flex-column">
          <h2 className="mb-4 fw-bold text-primary" style={{ letterSpacing: "1px" }}>
            Dashboard Statistics
          </h2>
          <div className="row">
            {filteredStats.map((stat, idx) => (
              <div className="col-xl-3 col-md-4 col-sm-6 mb-4" key={idx}>
                <div
                  className={`card shadow-lg border-0 h-100 ${darkMode ? "bg-gradient bg-secondary text-white" : "bg-white"}`}
                  style={{
                    borderRadius: "1rem",
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div className="card-body text-center">
                    <div
                      className={`mb-3 d-flex align-items-center justify-content-center`}
                      style={{
                        fontSize: "2.5rem",
                        color: darkMode ? "#ffd700" : "#007bff",
                        background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,123,255,0.1)",
                        borderRadius: "50%",
                        width: "70px",
                        height: "70px",
                        margin: "0 auto",
                      }}
                    >
                      {stat.icon}
                    </div>
                    <h6 className="card-title fw-semibold" style={{ fontSize: "1.1rem" }}>
                      {stat.label}
                    </h6>
                    <h2 className="card-text fw-bold" style={{ fontSize: "2rem" }}>
                      {stat.value}
                    </h2>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <>
            <Footer darkMode={darkMode} />
            <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
          </>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
