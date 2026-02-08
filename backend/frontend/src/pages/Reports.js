import React, { useState, useEffect, useRef } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Reports() {
    // Fixed teacher list for fallback
    const fixedTeachers = [
      { id: 1, name: "Mr. Jessie Aneslagon" },
      { id: 2, name: "Mr. Chae Dela Cruz" },
      { id: 3, name: "Mr. Denmark P. Aduna" },
      { id: 4, name: "Mr. Ronnel Reproto" },
      { id: 5, name: "Mr. Kurt Arellano" },
      { id: 6, name: "Mr Ace Abadenis" },
      { id: 7, name: "Mr. Richard Carpio" },
      { id: 8, name: "Mr. Shozu Abedenis" },
      { id: 9, name: "Mr. Ronnel Manuel" },
      { id: 10, name: "Ms. Shela Cruz" },
      { id: 11, name: "Ms. Abby Manlangit" },
      { id: 12, name: "Ms. Lorena Magsalong" },
      { id: 13, name: "Ms. Annie Cameshorton" },
      { id: 14, name: "Ms. Clarisse Ballesteros" },
      { id: 15, name: "Ms. Andrea Dali" },
      { id: 16, name: "Ms. Bennie Arlante" },
      { id: 17, name: "Mr. Lorence Robin" },
      { id: 18, name: "Mr. Pibels Aduna" },
      { id: 19, name: "Mr. Lloyd Manabat" },
      { id: 20, name: "Mr. Celherson Mesina" },
      { id: 21, name: "Mr. Andrei Quirante" },
    ];
  const user = sessionStorage.getItem("user") || "Guest";
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);

  // Dropdown Data
  // Remove users state for filter dropdown, use fixedTeachers only
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    teacher_id: "",
    room_id: "",
    subject_id: "",
    class_id: "",
    day_of_week: "",
  });

  const sidebarWidth = collapsed ? 80 : 250;
  const componentRef = useRef();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, roomsRes, subjectsRes, schedulesRes] = await Promise.all([
          fetch(process.env.REACT_APP_API_URL + "select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "class" }) }),
          fetch(process.env.REACT_APP_API_URL + "select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "rooms" }) }),
          fetch(process.env.REACT_APP_API_URL + "select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "subjects" }) }),
          fetch(process.env.REACT_APP_API_URL + "schedules")
        ]);

        const classesData = await classesRes.json();
        const roomsData = await roomsRes.json();
        const subjectsData = await subjectsRes.json();
        const schedulesData = await schedulesRes.json();

        if (classesData.success) setClasses(classesData.data);
        if (roomsData.success) setRooms(roomsData.data);
        if (subjectsData.success) setSubjects(subjectsData.data);
        const schedList = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.data || []);
        setSchedules(schedList);
        setFilteredSchedules(schedList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = schedules;
    if (filters.teacher_id) result = result.filter(s => String(s.teacher_id) === String(filters.teacher_id));
    if (filters.room_id) result = result.filter(s => String(s.room_id) === String(filters.room_id));
    if (filters.subject_id) result = result.filter(s => String(s.subject_id) === String(filters.subject_id));
    if (filters.class_id) result = result.filter(s => String(s.class_id) === String(filters.class_id));
    if (filters.day_of_week) result = result.filter(s => s.day_of_week === filters.day_of_week);
    setFilteredSchedules(result);
  }, [filters, schedules]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      teacher_id: "",
      room_id: "",
      subject_id: "",
      class_id: "",
      day_of_week: "",
    });
  };

  // PDF download handler
  const handlePrint = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Day", "Time", "Subject", "Description", "Room", "Teacher", "Class"]],
      body: filteredSchedules.map(row => [
        row.day_of_week || "—",
        `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
        row.subject?.subject_code || row.subject?.subject_name || "—",
        row.subject?.subject_name || row.description || "—",
        (() => {
          const r = row.room;
          if (!r) return "—";
          const parts = [r.room_code, r.room_name].filter(Boolean);
          return parts.length ? parts.join(" - ") : "—";
        })(),
        getTeacherLabel(row),
        getClassLabel(row)
      ]),
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 58, 64] },
      margin: { left: 14, right: 14 }
    });
    doc.setFontSize(16);
    doc.text("Schedule Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);
    doc.save("schedule-report.pdf");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const formatTime = (t) => {
    if (t == null || t === '') return '—';
    const s = String(t);
    let timeStr = '';
    if (s.match(/^\d{2}:\d{2}/)) {
      timeStr = s.substring(0, 5);
    } else if (s.includes('T')) {
      timeStr = s.split('T')[1]?.substring(0, 5) || '';
    } else {
      timeStr = s.substring(0, 5) || '';
    }
    if (!timeStr) return '—';
    const [hour, minute] = timeStr.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) return '—';
    let ampm = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };
  const getClassLabel = (row) => {
    const c = row.school_class || row.schoolClass;
    if (!c) return '—';
    const course = c.course || c.program?.program_name || '';
    const level = c.level ?? '';
    const section = c.section ?? '';
    return [course, level && section ? `${level}-${section}` : ''].filter(Boolean).join(' ') || '—';
  };
  const getTeacherLabel = (row) => {
    // Always resolve from fixedTeachers using teacher_id
    const match = fixedTeachers.find(u => String(u.id) === String(row.teacher_id));
    if (match) return match.name;
    return '—';
  };

  const columns = [
    { name: "Day", selector: row => row.day_of_week || '—', sortable: true, width: "100px" },
    { name: "Time", selector: row => `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`, sortable: true, width: "140px" },
    { name: "Subject", selector: row => (row.subject?.subject_code || row.subject?.subject_name || '—'), sortable: true },
    { name: "Description", selector: row => (row.subject?.subject_name || row.description || '—'), sortable: true, wrap: true },
    { name: "Room", selector: row => {
      const r = row.room;
      if (!r) return '—';
      const parts = [r.room_code, r.room_name].filter(Boolean);
      return parts.length ? parts.join(' - ') : '—';
    }, sortable: true, width: "150px" },
    { name: "Teacher", selector: row => getTeacherLabel(row), sortable: true },
    { name: "Class", selector: row => getClassLabel(row), sortable: true },
  ];

  const customStyles = {
    headCells: { style: { fontWeight: "bold", fontSize: "14px", backgroundColor: darkMode ? "#343a40" : "#fff", color: darkMode ? "#fff" : "#000" } },
    rows: { style: { fontSize: "14px", backgroundColor: darkMode ? "#343a40" : "#fff", color: darkMode ? "#fff" : "#000" } },
    pagination: { style: { backgroundColor: darkMode ? "#343a40" : "#fff", color: darkMode ? "#fff" : "#000" } },
  };

  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />
      <div className="d-flex flex-column flex-grow-1" style={{ marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0, transition: "margin-left 0.3s", minWidth: 0 }}>
        <Navbar user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} toggleSidebar={toggleSidebar} openMobileSidebar={openMobileSidebar} />

        <div className="flex-grow-1 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Reports</h4>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i> Print Report
            </button>
          </div>

          {/* Filters */}
          <div className="card p-3 mb-4 text-dark">
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label small fw-bold">Day</label>
                <select className="form-select form-select-sm" name="day_of_week" value={filters.day_of_week} onChange={handleFilterChange}>
                  <option value="">All Days</option>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Teacher</label>
                <select className="form-select form-select-sm" name="teacher_id" value={filters.teacher_id} onChange={handleFilterChange}>
                  <option value="">All Teachers</option>
                  {fixedTeachers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Room</label>
                <select className="form-select form-select-sm" name="room_id" value={filters.room_id} onChange={handleFilterChange}>
                  <option value="">All Rooms</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code || r.room_number || r.room_name || `Room ${r.id}`}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Subject</label>
                <select className="form-select form-select-sm" name="subject_id" value={filters.subject_id} onChange={handleFilterChange}>
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold">Class</label>
                <select className="form-select form-select-sm" name="class_id" value={filters.class_id} onChange={handleFilterChange}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.course} {c.level}-{c.section}</option>)}
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-sm btn-secondary w-100" onClick={clearFilters}>Clear Filters</button>
              </div>
            </div>
          </div>

          {/* Printable Area */}
          <div ref={componentRef} className="bg-white text-dark p-4 rounded shadow-sm">
            <div className="d-none d-print-block mb-4 text-center">
              <h2>Schedule Report</h2>
              <p className="text-muted">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <DataTable
              columns={columns}
              data={filteredSchedules}
              pagination
              highlightOnHover
              striped
              customStyles={customStyles}
              theme={darkMode ? "dark" : "default"}
            />

            <div className="d-none d-print-block mt-5">
              <div className="d-flex justify-content-between px-5">
                <div className="text-center">
                  <p className="mb-4">Prepared by:</p>
                  <div className="border-bottom border-dark" style={{ width: '200px' }}></div>
                  <p className="mt-2 fw-bold">{user}</p>
                </div>
                <div className="text-center">
                  <p className="mb-4">Approved by:</p>
                  <div className="border-bottom border-dark" style={{ width: '200px' }}></div>
                  <p className="mt-2 fw-bold">Dean / Department Head</p>
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

export default Reports;
