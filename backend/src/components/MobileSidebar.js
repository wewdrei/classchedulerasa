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
            <a href="#" className="nav-link active" onClick={onClose}>
              <i className="bi bi-house-door me-2"></i>Home
            </a>
          </li>
          <li>
            <a href="#" className="nav-link" onClick={onClose}>
              <i className="bi bi-people me-2"></i>Users
            </a>
          </li>
          <li>
            <a href="#" className="nav-link" onClick={onClose}>
              <i className="bi bi-gear me-2"></i>Settings
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MobileSidebar;
