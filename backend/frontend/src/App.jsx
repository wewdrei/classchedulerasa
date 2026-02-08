import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Import pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UsersManagement from "./pages/Users";
import Logout from "./pages/Logout";
import Program from "./pages/Program";
import Subjects from "./pages/Subjects";
import Rooms from "./pages/Rooms";
import Activity from "./pages/Logs";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import Masterlist from "./pages/Masterlist";

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const id = sessionStorage.getItem("id");
  const isAuthenticated = !!id;
  console.log("Is authenticated:", isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute>
              <UsersManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="program"
          element={
            <ProtectedRoute>
              <Program />
            </ProtectedRoute>
          }
        />
        {/* Backwards-compatible redirect */}
        <Route path="classes" element={<Navigate to="/program" replace />} />
        <Route
          path="subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="masterlist"
          element={
            <ProtectedRoute>
              <Masterlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="logout"
          element={
            <ProtectedRoute>
              <Logout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
