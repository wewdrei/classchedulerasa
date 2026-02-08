import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
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
        <button
          className="btn btn-sm btn-primary me-1"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </button>
        <button
          className="btn btn-sm btn-secondary me-1"
          onClick={() => onNavigate("PREV")}
        >
          Back
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => onNavigate("NEXT")}
        >
          Next
        </button>
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
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
const [rooms, setRooms] = useState([]);
const [conflicts, setConflicts] = useState([]);
 const typeNames = ["Regular Class", "Special Class", "Exam", "Assignment"];

 // Function to reset the form to add a new schedule
const handleNewSchedule = () => {
  setFormData({
    room_id: "",
    class_id: "",
    type: 0,
    description: "",
    datetime_start: "",
    datetime_end: "",
  });
  setEditScheduleId(null);
  setAutoDescription(true); // re-enable auto-description
};


const checkConflicts = (events) => {
  const conflictList = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];

      const sameRoom = e1.room_id === e2.room_id;
      const sameClass = e1.class_id === e2.class_id;

      const overlap =
        new Date(e1.start) < new Date(e2.end) &&
        new Date(e1.end) > new Date(e2.start);

      if (overlap && (sameRoom || sameClass)) {
        conflictList.push({
          first: e1,
          second: e2,
          type: sameRoom ? "room" : "class",
          typeName: typeNames[e1.type_number] || "Unknown",
        });
      }
    }
  }
  setConflicts(conflictList);
};

  const [formData, setFormData] = useState({
    room_id: "",
    class_id: "",
    type: 0,
    description: "",
    datetime_start: "",
    datetime_end: "",
  });
  const [editScheduleId, setEditScheduleId] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date()); // controlled date
  const [currentView, setCurrentView] = useState("month");      // controlled view

  const sidebarWidth = collapsed ? 80 : 250;

  // Fetch schedules with class and room info
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // Fetch schedules
      const res = await fetch(process.env.REACT_APP_API_URL + "select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "schedules" }),
      });
      const result = await res.json();

      // Fetch classes and rooms for mapping
      const [classRes, roomRes] = await Promise.all([
        fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        }),
        fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "rooms" }),
        }),
      ]);
      const classResult = await classRes.json();
      const roomResult = await roomRes.json();

      // Map class_id and room_id to their details
      const classMap = {};
      if (classResult.success && Array.isArray(classResult.data)) {
        classResult.data.forEach((c) => {
          classMap[c.id] = `${c.course || ""} ${c.level || ""} ${c.section || ""}`.trim();
        });
      }
      const roomMap = {};
      if (roomResult.success && Array.isArray(roomResult.data)) {
        roomResult.data.forEach((r) => {
          roomMap[r.id] = r.room_number;
        });
      }

      if (result.success && Array.isArray(result.data)) {
        setEvents(
          result.data.map((s) => ({
            id: s.id,
            title: s.description || "No Title",
            start: new Date(s.datetime_start),
            end: new Date(s.datetime_end),
            type_number: s.type,
            room_id: s.room_id,
            room_name: roomMap[s.room_id] || s.room_id,
            class_id: s.class_id,
            class_name: classMap[s.class_id] || s.class_id,
            type:
              s.type === 0
                ? "success"
                : s.type === 1
                ? "info"
                : s.type === 2
                ? "danger"
                : "warning",
          }))
        );
      } else {
        setEvents([]);
      }
      
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  fetchSchedules();
}, []); // empty array → runs only once on mount

useEffect(() => {
  if (events.length) checkConflicts(events); // recompute conflicts when events change
}, [events]);


  // Fetch users, classes, and rooms
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "users" }),
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setUsers(result.data);
      } catch (error) {
        setUsers([]);
      }
    };

    const fetchClasses = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "class" }),
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setClasses(result.data);
      } catch (error) {
        setClasses([]);
      }
    };

    const fetchRooms = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "rooms" }),
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setRooms(result.data);
      } catch (error) {
        setRooms([]);
      }
    };

    fetchUsers();
    fetchClasses();
    fetchRooms();
    fetchSchedules();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
  };
  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

const [autoDescription, setAutoDescription] = useState(true);

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    const updated = { ...prev, [name]: value };

const updatedClassId = Number(updated.class_id);
const updatedRoomId = Number(updated.room_id);

const selectedClass = classes.find(c => c.id === updatedClassId);
const selectedRoom = rooms.find(r => r.id === updatedRoomId);

    const selectedType = typeNames[updated.type] || "";

    // Only auto-update description if autoDescription is true
    if (autoDescription || name === "type" || name === "class_id" || name === "room_id") {
      const classText = selectedClass ? `${selectedClass.section} - ${selectedClass.level} - ${selectedClass.course}` : "";
      const roomText = selectedRoom ? selectedRoom.room_number : "";
      updated.description = `Class (${classText}${classText && roomText ? ") will use room (" : ""}${roomText}${(classText || roomText) && selectedType ? ") for (" : ""}${selectedType})`;
    }

    return updated;
  });

  // If the user manually types in the description, stop auto-updating it
  if (name === "description") setAutoDescription(false);
  else setAutoDescription(true); // changing type/class/room keeps auto-update
};

    const handleAddSchedule = async (e) => {
e.preventDefault();
try {
const response = await fetch(process.env.REACT_APP_API_URL + "insert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    table: "schedules",
    data: formData,
  }),
});
const result = await response.json();   
if (result.success) { 
  Swal.fire("Success", "Schedule added successfully!", "success");  
  setFormData({ room_id: "", class_id: "", type: 0, description: "", datetime_start: "", datetime_end: "" });
fetchSchedules(); 

}
} catch (error) { 
  Swal.fire("Error", "Failed to add schedule.", "error");
}


  };

  const handleEditSchedule = async (e, updatedEvent = null) => {
    if (e) e.preventDefault();

    const id = updatedEvent?.id || editScheduleId;
    if (!id) {
      Swal.fire("Error", "No schedule selected for update.", "error");
      return;
    }
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "schedules",
          data: updatedEvent
            ? updatedEvent
            : formData,
          conditions: { id },
        }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Schedule updated successfully!", "success");
        if (!updatedEvent) {
          setFormData({ room_id: "", class_id: "", type: 0, description: "", datetime_start: "", datetime_end: "" });
          setEditScheduleId(null);
        }
        fetchSchedules();
      } else Swal.fire("Error", result.message || "Failed to update schedule.", "error");
    } catch (error) {
      Swal.fire("Error", "Failed to update schedule.", "error");
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "schedules", conditions: { id } }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "Schedule deleted successfully.", "success");
        fetchSchedules();
      } else Swal.fire("Error", result.message || "Failed to delete schedule.", "error");
    } catch (error) {
      Swal.fire("Error", "Failed to delete schedule.", "error");
    }
  };

  const handleSelectEvent = (event) => {
  const typeLabel = typeNames[event.type_number] || "Unknown";
  const roomLabel = event.room_name || event.room_id;
  const classLabel = event.class_name || event.class_id;

  Swal.fire({
    title: event.title,
    html: ` <p><strong>Class:</strong> ${classLabel}</p><p><strong>Start:</strong> ${new Date(event.start).toLocaleString()}</p>
           <p><strong>End:</strong> ${new Date(event.end).toLocaleString()}</p>
           <p><strong>Type:</strong> ${typeLabel}</p>
           
           <p><strong>Room:</strong> ${roomLabel}</p>
          `,
    icon: "info",
    confirmButtonText: "Close",
    customClass: { popup: darkMode ? "bg-dark text-white" : "" },
  });

    setFormData({
      room_id: event.room_id || "",
      class_id: event.class_id || "",
      type: event.type_number ?? 0,
      description: event.title || "",
      datetime_start: new Date(event.start).toISOString().slice(0, 16),      datetime_end: new Date(event.end).toISOString().slice(0, 16),
    });
    setEditScheduleId(event.id);
  };

  const moveEvent = ({ event, start, end }) => {
    const updatedData = {
      datetime_start: start.toISOString().slice(0, 19),
      datetime_end: end.toISOString().slice(0, 19),
    };
    handleEditSchedule(null, { id: event.id, ...updatedData });
  };

  const eventStyleGetter = (event) => {
    let bg = "#3174ad";
    if (event.type === "success") bg = "#28a745";
    if (event.type === "danger") bg = "#dc3545";
    if (event.type === "info") bg = "#17a2b8";
    if (event.type === "warning") bg = "#ffc107";
    return { style: { backgroundColor: bg, color: "white", borderRadius: "5px", border: "none" } };
  };

  // Toolbar handlers to control view and date
  const handleNavigate = (action) => {
    let newDate = new Date(currentDate);
    if (action === "TODAY") newDate = new Date();
    else if (action === "PREV") {
      if (currentView === "month") newDate.setMonth(newDate.getMonth() - 1);
      else if (currentView === "week") newDate.setDate(newDate.getDate() - 7);
      else newDate.setDate(newDate.getDate() - 1);
    } else if (action === "NEXT") {
      if (currentView === "month") newDate.setMonth(newDate.getMonth() + 1);
      else if (currentView === "week") newDate.setDate(newDate.getDate() + 7);
      else newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />
      <div
        className="d-flex flex-column flex-grow-1"
        style={{ marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0, transition: "margin-left 0.3s", minWidth: 0 }}
      >
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} toggleSidebar={toggleSidebar} openMobileSidebar={openMobileSidebar} />
        <div className="flex-grow-1 p-4">
          <div className="row">
            <div className="col-12 col-md-8 mb-4">
              <div className="card p-4 h-100">
                <h4 className="mb-3">Calendar</h4>
                  <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                  style={{ height: "70vh" }}
                    selectable
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    draggableAccessor={() => true}
                    onEventDrop={moveEvent}
                    resizable
                    onEventResize={moveEvent}
                    components={{
                      toolbar: (toolbarProps) => (
                        <CustomToolbar
                          {...toolbarProps}
                          onNavigate={handleNavigate}
                          onView={handleViewChange}
                        />
                      ),
                    }}
                    date={currentDate}   // controlled date
                    view={currentView}   // controlled view
                    onNavigate={setCurrentDate}
                    onView={setCurrentView}
                  />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card p-4">
                <h4 className="mb-3">{editScheduleId ? "Edit Schedule" : "Add Schedule"}</h4>
{conflicts.length > 0 && (
  <div className="alert alert-danger mb-3">
    <h5>Schedule Conflicts Detected:</h5>
    <ul className="mb-0" style={{ listStyle: "none", paddingLeft: 0 }}>
      {conflicts.map((c, idx) => (
        <li key={idx} style={{ marginBottom: "1rem" }}>
          <strong>{c.first.title}</strong> overlaps with <strong>{c.second.title}</strong><br />
          {new Date(c.first.start).toLocaleString()} - {new Date(c.first.end).toLocaleString()}<br />
          {new Date(c.second.start).toLocaleString()} - {new Date(c.second.end).toLocaleString()}
        </li>
      ))}
    </ul>
  </div>
)}


                <form onSubmit={editScheduleId ? handleEditSchedule : handleAddSchedule}>
              <div className="mb-3">
  <label className="form-label"><strong>Room</strong></label>
<select
  className="form-control"
  name="room_id"
  value={formData.room_id}
  onChange={handleChange}
  required
>
  <option value="">Select Room</option>
  {rooms.map((r) => (
    <option
      key={r.id}
      value={r.id}
      disabled={r.status === 1} // disable inactive rooms
    >
      {r.room_number} {r.status === 1 ? "(Unavailable)" : ""}
    </option>
  ))}
</select>

</div>

<div className="mb-3">
  <label className="form-label"><strong>Class</strong></label>
  <select
    className="form-control"
    name="class_id"
    value={formData.class_id}
    onChange={handleChange}
    required
  >
    <option value="">Select Class</option>
    {classes.map((c) => (
      <option key={c.id} value={c.id}>
        {`${c.section} - ${c.level} - ${c.course}`}
      </option>
    ))}
  </select>
</div>

                  <div className="mb-3">
                    <label className="form-label"><strong>Type</strong></label>
                    <select className="form-control" name="type" value={formData.type} onChange={handleChange}>
                      <option value={0}>Regular Class</option>
                      <option value={1}>Special Class</option>
                      <option value={2}>Exam</option>
                      <option value={3}>Assignment</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Description</strong></label>
                    <input type="text" className="form-control" name="description" value={formData.description} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Start Date & Time</strong></label>
                    <input type="datetime-local" className="form-control" name="datetime_start" value={formData.datetime_start} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>End Date & Time</strong></label>
                    <input type="datetime-local" className="form-control" name="datetime_end" value={formData.datetime_end} onChange={handleChange} required />
                  </div>
                  
<div className="d-flex gap-2">
  <button type="submit" className="btn btn-primary flex-grow-1">
    {editScheduleId ? "Update Schedule" : "Add Schedule"}
  </button>

  {editScheduleId && (
    <>
      <button
        type="button"
        className="btn btn-secondary flex-grow-1"
        onClick={handleNewSchedule}
      >
        Add New
      </button>

      <button
        type="button"
        className="btn btn-danger flex-grow-1"
        onClick={() => {
          if (window.confirm("Are you sure you want to delete this schedule?")) {
            handleDeleteSchedule(editScheduleId);
          }
        }}
      >
        Delete
      </button>
    </>
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