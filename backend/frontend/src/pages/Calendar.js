import { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiFetch } from "../utils/api";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth, endOfWeek, isSameDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import Swal from "sweetalert2";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});
const DnDCalendar = withDragAndDrop(Calendar);

// Custom toolbar
const CustomToolbar = ({ label, onNavigate, onView }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        <button className="btn btn-sm btn-primary me-1" onClick={() => onNavigate("TODAY")}>Today</button>
        <button className="btn btn-sm btn-secondary me-1" onClick={() => onNavigate("PREV")}>Back</button>
        <button className="btn btn-sm btn-primary" onClick={() => onNavigate("NEXT")}>Next</button>
      </div>
      <h5 className="mb-0">{label}</h5>
      <div>
        <button className="btn btn-outline-primary me-1" onClick={() => onView("month")}>Month</button>
        <button className="btn btn-outline-primary me-1" onClick={() => onView("week")}>Week</button>
        <button className="btn btn-outline-primary" onClick={() => onView("day")}>Day</button>
      </div>
    </div>
  );
};

function CalendarPage() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [events, setEvents] = useState([]); // Displayed events (recurring instances)
  const [rawSchedules, setRawSchedules] = useState([]); // Raw weekly schedules from API

  const [users, setUsers] = useState([]); // Teachers
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  const [formData, setFormData] = useState({
    room_id: "",
    class_id: "",
    subject_id: "",
    teacher_id: "",
    days: [], // Array of strings: ['Mon', 'Wed']
    start_time: "",
    end_time: "",
    type: "Lecture",
    description: "",
  });

  const [editScheduleId, setEditScheduleId] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const sidebarWidth = collapsed ? 80 : 250;

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, classesRes, roomsRes, subjectsRes] = await Promise.all([
          apiFetch("select", { method: "POST", body: JSON.stringify({ table: "users" }) }),
          apiFetch("select", { method: "POST", body: JSON.stringify({ table: "class" }) }),
          apiFetch("select", { method: "POST", body: JSON.stringify({ table: "rooms" }) }),
          apiFetch("select", { method: "POST", body: JSON.stringify({ table: "subjects" }) }),
        ]);

        const usersData = await usersRes.json();
        const classesData = await classesRes.json();
        const roomsData = await roomsRes.json();
        const subjectsData = await subjectsRes.json();

        if (usersData.success) setUsers(usersData.data);
        if (classesData.success) setClasses(classesData.data);
        if (roomsData.success) setRooms(roomsData.data);
        if (subjectsData.success) setSubjects(subjectsData.data);

        fetchSchedules();

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await apiFetch("schedules");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRawSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  // Generate Events from Raw Schedules based on View Range
  useEffect(() => {
    if (!rawSchedules.length) {
      setEvents([]);
      return;
    }

    let start, end;
    if (currentView === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
      // Adjust to full weeks to cover visible grid
      start = startOfWeek(start, { weekStartsOn: 1 });
      end = endOfWeek(end, { weekStartsOn: 1 });
    } else if (currentView === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else { // day
      start = currentDate;
      end = currentDate;
    }

    const generatedEvents = [];
    let loopDate = new Date(start);

    while (loopDate <= end) {
      const dayName = format(loopDate, 'EEE'); // Mon, Tue, ...

      const daySchedules = rawSchedules.filter(s => s.day_of_week === dayName);

      daySchedules.forEach(s => {
        // Parse time strings "10:00:00" -> Date on loopDate
        const [startH, startM] = s.start_time.split(':');
        const [endH, endM] = s.end_time.split(':');

        const eventStart = new Date(loopDate);
        eventStart.setHours(parseInt(startH), parseInt(startM), 0);

        const eventEnd = new Date(loopDate);
        eventEnd.setHours(parseInt(endH), parseInt(endM), 0);

        generatedEvents.push({
          id: s.id, // Schedule ID
          title: s.description || `${s.subject?.subject_code || 'Subject'} (${s.room?.room_code || s.room?.room_name || 'Room'})`,
          start: eventStart,
          end: eventEnd,
          resource: s,
          type: s.type,
          allDay: false
        });
      });

      loopDate = addDays(loopDate, 1);
    }
    setEvents(generatedEvents);

  }, [rawSchedules, currentDate, currentView]);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayChange = (day) => {
    setFormData(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflicts([]);

    // Prepare Payload
    const payload = {
      ...formData,
      // days is already array
    };

    try {
      const endpoint = editScheduleId ? "schedules/" + editScheduleId : "schedules";
      const method = editScheduleId ? "PUT" : "POST";
      if (editScheduleId) {
        payload.day_of_week = formData.days[0];
        delete payload.days;
      }

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Success", editScheduleId ? "Schedule updated!" : "Schedule(s) added!", "success");
        setFormData({
          room_id: "",
          class_id: "",
          subject_id: "",
          teacher_id: "",
          days: [],
          start_time: "",
          end_time: "",
          type: "Lecture",
          description: "",
        });
        setEditScheduleId(null);
        fetchSchedules();
      } else {
        if (res.status === 422 && result.conflicts) {
          // Flatten conflicts for display
          const conflictMsgs = [];
          Object.entries(result.conflicts).forEach(([day, errs]) => {
            Object.values(errs).forEach(msg => conflictMsgs.push(`${day}: ${msg}`));
          });
          setConflicts(conflictMsgs);
          Swal.fire("Conflict", "Schedule conflicts detected.", "warning");
        } else {
          Swal.fire("Error", result.message || "Failed to save schedule.", "error");
        }
      }
    } catch (error) {
      Swal.fire("Error", "Network error.", "error");
    }
  };

  const handleSelectEvent = (event) => {
    const s = event.resource;
    Swal.fire({
      title: "Schedule Details",
      html: `
        <p><strong>Subject:</strong> ${s.subject?.subject_code} - ${s.subject?.subject_name}</p>
        <p><strong>Teacher:</strong> ${s.teacher?.name}</p>
        <p><strong>Room:</strong> ${s.room?.room_name} (${s.room?.room_code})</p>
        <p><strong>Class:</strong> ${s.school_class?.course} ${s.school_class?.level}-${s.school_class?.section}</p>
        <p><strong>Time:</strong> ${s.start_time} - ${s.end_time}</p>
        <p><strong>Day:</strong> ${s.day_of_week}</p>
      `,
      showCancelButton: true,
      confirmButtonText: "Edit",
      cancelButtonText: "Delete",
      cancelButtonColor: "#d33"
    }).then((result) => {
      if (result.isConfirmed) {
        // Edit
        setFormData({
          room_id: s.room_id,
          class_id: s.class_id,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
          days: [s.day_of_week],
          start_time: s.start_time.substring(0, 5), // HH:mm
          end_time: s.end_time.substring(0, 5),
          type: s.type,
          description: s.description || ""
        });
        setEditScheduleId(s.id);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Delete
        handleDelete(s.id);
      }
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await apiFetch(`schedules/${id}`, { method: "DELETE" });
      if (res.ok) {
        Swal.fire("Deleted", "Schedule deleted.", "success");
        fetchSchedules();
      } else {
        Swal.fire("Error", "Failed to delete.", "error");
      }
    } catch (e) {
      Swal.fire("Error", "Network error.", "error");
    }
  };

  const eventStyleGetter = (event) => {
    let bg = "#3174ad";
    if (event.type === "Lecture") bg = "#28a745";
    if (event.type === "Lab") bg = "#17a2b8";
    if (event.type === "Exam") bg = "#dc3545";
    return { style: { backgroundColor: bg, color: "white", borderRadius: "5px", border: "none" } };
  };

  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />
      <div className="d-flex flex-column flex-grow-1" style={{ marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0, transition: "margin-left 0.3s", minWidth: 0 }}>
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} toggleSidebar={toggleSidebar} openMobileSidebar={openMobileSidebar} />
        <div className="flex-grow-1 p-4">
          <div className="row">
            <div className="col-12 col-md-8 mb-4">
              <div className="card p-4 h-100">
                <h4 className="mb-3">Weekly Schedule</h4>
                <DnDCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "70vh" }}
                  selectable
                  onSelectEvent={handleSelectEvent}
                  eventPropGetter={eventStyleGetter}
                  draggableAccessor={() => false} // Disable drag for now as it complicates recurring logic
                  date={currentDate}
                  view={currentView}
                  onNavigate={setCurrentDate}
                  onView={setCurrentView}
                  components={{ toolbar: (props) => <CustomToolbar {...props} /> }}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card p-4">
                <h4 className="mb-3">{editScheduleId ? "Edit Schedule" : "Add Schedule"}</h4>

                {conflicts.length > 0 && (
                  <div className="alert alert-danger">
                    <ul className="mb-0 ps-3">
                      {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Subject */}
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select className="form-control" name="subject_id" value={formData.subject_id} onChange={handleChange} required>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>)}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div className="mb-3">
                    <label className="form-label">Teacher</label>
                    <select className="form-control" name="teacher_id" value={formData.teacher_id} onChange={handleChange} required>
                      <option value="">Select Teacher</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  {/* Class */}
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <select className="form-control" name="class_id" value={formData.class_id} onChange={handleChange} required>
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.course} {c.level}-{c.section}</option>)}
                    </select>
                  </div>

                  {/* Room */}
                  <div className="mb-3">
                    <label className="form-label">Room</label>
                    <select className="form-control" name="room_id" value={formData.room_id} onChange={handleChange} required>
                      <option value="">Select Room</option>
                      {rooms.map(r => <option key={r.id} value={r.id} disabled={r.status === 'Inactive' || r.status === 'Under Renovation'}>{r.room_code} - {r.room_name} ({r.status})</option>)}
                    </select>
                  </div>

                  {/* Days (Only show in Add mode or single day in Edit mode) */}
                  <div className="mb-3">
                    <label className="form-label d-block">Days</label>
                    <div className="d-flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <div key={day} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`day-${day}`}
                            checked={formData.days.includes(day)}
                            onChange={() => handleDayChange(day)}
                            disabled={editScheduleId && formData.days[0] !== day} // Lock other days in edit mode
                          />
                          <label className="form-check-label" htmlFor={`day-${day}`}>{day}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} required />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-control" name="type" value={formData.type} onChange={handleChange}>
                      <option value="Lecture">Lecture</option>
                      <option value="Lab">Lab</option>
                      <option value="Exam">Exam</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description (Optional)</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="2"></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1">
                      {editScheduleId ? "Update" : "Add Schedule"}
                    </button>
                    {editScheduleId && (
                      <button type="button" className="btn btn-secondary" onClick={() => {
                        setEditScheduleId(null);
                        setFormData({ ...formData, days: [], start_time: "", end_time: "", description: "" });
                      }}>Cancel</button>
                    )}
                  </div>
                </form>
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

export default CalendarPage;
