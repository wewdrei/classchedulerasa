import React from "react";

const MobileSidebar = ({ open, onClose }) => {
  return (
    <div
      className={`offcanvas offcanvas-start${open ? " show" : ""}`}
      tabIndex="-1"
      id="mobileSidebar"
      style={{ visibility: open ? "visible" : "hidden", zIndex: 2000 }}
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">Menu</h5>
        <button
          type="button"
          className={`btn-close animated-close${open ? " visible" : ""}`}
          onClick={onClose}
        ></button>
      </div>
      <div className="offcanvas-body">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item">
            <button type="button" className="nav-link btn btn-link text-start p-0 active" onClick={onClose} aria-label="Home">
              <i className="bi bi-house-door me-2"></i>Home
            </button>
          </li>
          <li>
            <button type="button" className="nav-link btn btn-link text-start p-0" onClick={onClose} aria-label="Users">
              <i className="bi bi-people me-2"></i>Users
            </button>
          </li>
          <li>
            <button type="button" className="nav-link btn btn-link text-start p-0" onClick={onClose} aria-label="Settings">
              <i className="bi bi-gear me-2"></i>Settings
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MobileSidebar;
