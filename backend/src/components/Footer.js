import React from "react";

const Footer = ({ darkMode }) => {
  return (
    <footer className={`${darkMode ? "bg-dark text-white" : "bg-light text-dark"} py-3 text-center mt-auto border-top`}>
      <span>© {new Date().getFullYear()} My Dashboard. All Rights Reserved.</span>
    </footer>
  );
};

export default Footer;
