import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
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

// Attempt a more robust programmatic load: fetch the Google Fonts css2 stylesheet
// and extract the woff2 URLs for the weights we need, then load them via the
// FontFace API. If that fails, fall back to a simpler detection (document.fonts).
;(function fetchAndLoadPoppins() {
  const gfCssUrl = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
  const root = document.documentElement;
  const weightsToEnsure = ['700', '800'];
  const timeoutMs = 3500;

  function markFailed(msg) {
    root.classList.add('fonts-failed');
    console.warn(msg);
  }

  function markLoaded() {
    root.classList.add('fonts-loaded');
    console.info('Poppins programmatically loaded (requested weights).');
  }

  // Fetch the CSS from Google Fonts and parse for woff2 urls per weight.
  fetch(gfCssUrl, { mode: 'cors' }).then(r => {
    if (!r.ok) throw new Error('Failed to fetch Google Fonts CSS: ' + r.status);
    return r.text();
  }).then(cssText => {
    // Regex to capture @font-face blocks and their font-weight and URL.
    // This handles common Google Fonts css2 responses which include multiple
    // @font-face blocks, one per unicode-range / weight / style.
    const faceRegex = /@font-face\s*{([^}]+)}/g;
    const srcUrlRegex = /src:\s*url\(([^)]+)\)\s+format\('woff2'\)/i;
    const weightRegex = /font-weight:\s*(\d+)/i;

    const found = {};
    let m;
    while ((m = faceRegex.exec(cssText)) !== null) {
      const block = m[1];
      const wMatch = block.match(weightRegex);
      const sMatch = block.match(srcUrlRegex);
      if (wMatch && sMatch) {
        const w = wMatch[1];
        const url = sMatch[1].trim().replace(/^"|"$/g, '');
        if (weightsToEnsure.includes(w)) {
          found[w] = url;
        }
      }
    }

    // If we didn't find any urls for our weights, fallback to check-only.
    const missing = weightsToEnsure.filter(w => !found[w]);
    if (missing.length === 0) {
      // Create FontFace objects and load them.
      const loadFaces = Object.entries(found).map(([w, url]) => {
        try {
          const face = new FontFace('Poppins', `url(${url}) format('woff2')`, { weight: w, style: 'normal' });
          return face.load().then(loaded => {
            try { document.fonts.add(loaded); } catch (e) { /* ignore */ }
            return { weight: w, ok: true };
          }).catch(() => ({ weight: w, ok: false }));
        } catch (err) {
          return Promise.resolve({ weight: w, ok: false });
        }
      });

      // Race against a timeout to avoid hanging the page load.
      const timer = new Promise(res => setTimeout(() => res('timeout'), timeoutMs));
      return Promise.race([Promise.all(loadFaces), timer]);
    }

    return 'no-urls';
  }).then(result => {
    if (result === 'no-urls' || result === 'timeout') {
      // Fallback to simple detection when fetching or loading fails.
      // Use document.fonts to check weights (existing fallback).
      if (document.fonts && document.fonts.check) {
        const ok = weightsToEnsure.every(w => document.fonts.check(`${w} 1em 'Poppins'`));
        if (ok) markLoaded();
        else markFailed('Poppins weights not available via FontFace; falling back to system sans.');
      } else {
        markFailed('Could not programmatically load Poppins; Font Loading API not available.');
      }
      return;
    }

    // result is an array of load statuses per weight
    if (Array.isArray(result)) {
      const failed = result.filter(r => !r.ok).map(r => r.weight);
      if (failed.length === 0) markLoaded();
      else markFailed('Some Poppins weights failed to load: ' + failed.join(', '));
    }
  }).catch(err => {
    // Final fallback: use document.fonts detection and mark accordingly.
    if (document.fonts && document.fonts.check) {
      const ok = weightsToEnsure.every(w => document.fonts.check(`${w} 1em 'Poppins'`));
      if (ok) root.classList.add('fonts-loaded');
      else markFailed('Error fetching Google Fonts CSS and required weights are missing.');
    } else {
      markFailed('Error loading Poppins fonts: ' + err);
    }
  });
})();
