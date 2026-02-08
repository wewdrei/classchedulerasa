import React, { useState, useEffect, useRef } from "react";

const Navbar = ({ user, darkMode, toggleDarkMode, toggleSidebar, handleLogout, openMobileSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`navbar navbar-expand-lg ${darkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"} border-bottom`}
    >
      <div className="container-fluid">
        <button className="btn btn-outline-secondary me-3 d-none d-md-inline" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <button className="btn btn-outline-secondary me-3 d-md-none" onClick={openMobileSidebar}>
          <i className="bi bi-list"></i>
        </button>

        <div className="d-flex align-items-center">
          <span className="me-3 fw-bold d-none d-md-block">{formatTime(currentTime)}</span>

          <button className="btn btn-outline-secondary me-3" onClick={toggleDarkMode}>
            <i className={darkMode ? "bi bi-sun" : "bi bi-moon"}></i>
          </button>

          <div className="dropdown" style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="btn p-0 border-0 bg-transparent d-flex align-items-center"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src={(function () {
                  const raw = (sessionStorage.getItem("profile") || "").trim();
                  if (!raw) return "https://via.placeholder.com/40";
                  if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('//')) return raw;
                  // prefer backend origin from REACT_APP_API_URL when available
                  let apiOrigin = null;
                  try { const api = process.env.REACT_APP_API_URL; if (api) apiOrigin = new URL(api, window.location.origin).origin; } catch (e) { apiOrigin = null; }
                  // /storage/ absolute
                  if (raw.startsWith('/storage/')) return (apiOrigin || window.location.origin) + raw;
                  if (raw.startsWith('storage/')) return (apiOrigin || window.location.origin) + '/' + raw;
                  // server-saved filename like 'profiles/abc.png' or 'uploads/xyz.jpg'
                  if (raw.match(/^[a-z0-9_\-]+\/.+\.(png|jpe?g|gif|webp|svg)$/i)) {
                    return (apiOrigin || window.location.origin) + '/storage/' + raw.replace(/^\//, '');
                  }
                  if (apiOrigin) return apiOrigin + '/' + raw.replace(/^\//, '');
                  return window.location.origin + '/' + raw.replace(/^\//, '');
                })()}
                alt="profile"
                className="rounded-circle"
                width="40"
                height="40"
              />
            </button>

            {dropdownOpen && (
              <ul
                className="dropdown-menu dropdown-menu-end shadow show"
                style={{ display: "block", position: "absolute", right: 0 }}
              >
                <li>
                  <a className="dropdown-item" href="/profile">
                    Profile
                  </a>
                </li>
                <li>
                  <button className="dropdown-item" onClick={toggleDarkMode}>
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className="dropdown-item text-danger"
                    href="/logout"
                  >
                    Logout
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
