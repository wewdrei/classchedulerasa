import { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';
// Import FontAwesome icons
import {
  FaUsers, FaChalkboardTeacher, FaDoorOpen, FaCalendarAlt, FaBook,
  FaUserShield, FaUserCog, FaDoorClosed,
  FaClipboardList, FaClipboardCheck, FaClipboard, FaLayerGroup, FaRegStar,
  FaChartLine, FaPercent
} from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // States for aggregated data
  const [stats, setStats] = useState({ users: 0, classes: 0, rooms: 0, schedules: 0, subjects: 0 });
  const [roomUtilization, setRoomUtilization] = useState([]);
  const [teacherWorkload, setTeacherWorkload] = useState([]);
  const [sectioningProgress, setSectioningProgress] = useState({ total: 0, scheduled: 0, percentage: 0 });
  const [scheduleStatus, setScheduleStatus] = useState([]);
  const [userRoles, setUserRoles] = useState([]);

  const role = (sessionStorage.getItem("role") || "").toString();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const endpoints = [
      { url: 'dashboard/stats', setter: setStats },
      { url: 'dashboard/room-utilization', setter: setRoomUtilization },
      { url: 'dashboard/teacher-workload', setter: setTeacherWorkload },
      { url: 'dashboard/sectioning-progress', setter: setSectioningProgress },
      { url: 'dashboard/schedule-status', setter: setScheduleStatus },
      { url: 'dashboard/user-roles', setter: setUserRoles },
    ];

    endpoints.forEach(async (ep) => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + ep.url);
        const data = await res.json();
        ep.setter(data);
      } catch (e) {
        console.error(`Failed to fetch ${ep.url}`, e);
      }
    });
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Chart Data Preparation

  // 1. Schedule Types (Status)
  const scheduleTypesData = {
    labels: scheduleStatus.map(s => s.type || 'Unknown'),
    datasets: [{
      label: 'Schedules by Type',
      data: scheduleStatus.map(s => s.total),
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderWidth: 1,
    }],
  };

  // 2. User Roles
  const userRolesData = {
    labels: userRoles.map(u => {
      const r = u.role.toUpperCase();
      if (r === "SUPERADMIN") return "Manager";
      if (r === "ADMIN") return "Staff";
      return u.role;
    }),
    datasets: [{
      label: 'Users by Role',
      data: userRoles.map(u => u.total),
      backgroundColor: [
        'rgba(0, 123, 255, 0.8)',
        'rgba(40, 167, 69, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(220, 53, 69, 0.8)',
      ],
      borderWidth: 1,
    }],
  };

  // 3. Room Utilization (Top 5)
  const roomUtilizationData = {
    labels: roomUtilization.map(r => r.name),
    datasets: [{
      label: 'Schedules Count',
      data: roomUtilization.map(r => r.count),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  // 4. Teacher Workload (Top 5)
  const teacherWorkloadData = {
    labels: teacherWorkload.map(t => t.name),
    datasets: [{
      label: 'Classes Assigned',
      data: teacherWorkload.map(t => t.count),
      backgroundColor: 'rgba(255, 159, 64, 0.8)',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} />
      <div className="main-content">
        <Navbar
          user={user}
          time={time}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />
        <div className="flex-grow-1 p-4">
          <h4 className="mb-3">Dashboard Statistics</h4>

          {/* Top Cards Matrix */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`} style={{ borderLeft: "4px solid #007bff" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Users</h6>
                      <h3 className="fw-bold mb-0" style={{ color: "#007bff" }}>{stats.users}</h3>
                    </div>
                    <FaUsers style={{ fontSize: "2.5rem", color: "#007bff", opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`} style={{ borderLeft: "4px solid #20c997" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Rooms</h6>
                      <h3 className="fw-bold mb-0" style={{ color: "#20c997" }}>{stats.rooms}</h3>
                    </div>
                    <FaDoorOpen style={{ fontSize: "2.5rem", color: "#20c997", opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`} style={{ borderLeft: "4px solid #fd7e14" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Schedules</h6>
                      <h3 className="fw-bold mb-0" style={{ color: "#fd7e14" }}>{stats.schedules}</h3>
                    </div>
                    <FaCalendarAlt style={{ fontSize: "2.5rem", color: "#fd7e14", opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`} style={{ borderLeft: "4px solid #17a2b8" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Sectioning Progress</h6>
                      <h3 className="fw-bold mb-0" style={{ color: "#17a2b8" }}>{sectioningProgress.percentage}%</h3>
                      <small className="text-muted">{sectioningProgress.scheduled} / {sectioningProgress.total} Classes</small>
                    </div>
                    <FaPercent style={{ fontSize: "2.5rem", color: "#17a2b8", opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`}>
                <div className="card-header bg-transparent border-0">
                  <h5 className="mb-0">Schedule Status (Types)</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <Doughnut data={scheduleTypesData} options={chartOptions} />
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`}>
                <div className="card-header bg-transparent border-0">
                  <h5 className="mb-0">User Roles Distribution</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <Bar data={userRolesData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`}>
                <div className="card-header bg-transparent border-0">
                  <h5 className="mb-0">Top 5 Most Used Rooms</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <Bar data={roomUtilizationData} options={chartOptions} />
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className={`card shadow border-0 h-100 ${darkMode ? "bg-dark text-white" : "bg-white"}`}>
                <div className="card-header bg-transparent border-0">
                  <h5 className="mb-0">Teacher Workload (Top 5)</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <Bar data={teacherWorkloadData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

        </div>
        <Footer darkMode={darkMode} />
      </div>
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
    </div>
  );
}

export default Dashboard;
