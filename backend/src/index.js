import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- PATCH FETCH GLOBALLY ---
const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  if (options.method && options.method.toUpperCase() === "POST") {
    const sessionId = sessionStorage.getItem("id");

    let bodyObj = {};
    if (options.body) {
      try {
        bodyObj = JSON.parse(options.body);
      } catch {
        bodyObj = {};
      }
    }

    bodyObj.user_id_session = sessionId;

    options.body = JSON.stringify(bodyObj);

    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
  }

  return originalFetch(url, options);
};
// --- END PATCH FETCH ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
