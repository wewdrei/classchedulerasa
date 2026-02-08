import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import Swal from 'sweetalert2'
import App from './App.jsx'

// Realtime uses SSE only; Pusher/Echo fully removed
window.Swal = Swal;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
