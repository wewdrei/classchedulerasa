
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Form, Button, Spinner } from 'react-bootstrap';
import PasswordInput from '../components/PasswordInput';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    if (id) {
      window.location.href = "/dashboard";
    }
  }, []);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  useEffect(() => {
    const storedAttempts = parseInt(sessionStorage.getItem("failedAttempts") || "0", 10);
    const storedLockout = sessionStorage.getItem("lockoutUntil");
    setFailedAttempts(storedAttempts);
    setLockoutUntil(storedLockout ? new Date(storedLockout) : null);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (lockoutUntil && new Date() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - new Date()) / 60000);
      Swal.fire({
        icon: "error",
        title: "Account Locked",
        text: `Too many failed attempts. Please try again in ${remaining} minute(s).`,
      });
      return;
    }

    if (email.trim() !== "" && password.trim() !== "") {
      try {
        setLoading(true);
        const response = await fetch(process.env.REACT_APP_API_URL + "login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const userData = result.data[0]; // Backend returns array to match old expectations
          Object.entries(userData).forEach(([key, value]) => {
            if (value === null || value === undefined) {
              sessionStorage.setItem(key, '');
            } else {
              sessionStorage.setItem(key, value);
            }
          });
          sessionStorage.setItem("failedAttempts", "0");
          sessionStorage.removeItem("lockoutUntil");

          // Audit log is now handled by backend


          // successful login -> redirect (no need to explicitly set loading false before unload)
          window.location.href = "/";
        } else {
          let newAttempts = failedAttempts + 1;
          let lockMinutes = 0;
          if (newAttempts >= 5) lockMinutes = 5;
          else if (newAttempts >= 3) lockMinutes = 3;

          if (lockMinutes > 0) {
            const until = new Date(Date.now() + lockMinutes * 60000);
            setLockoutUntil(until);
            sessionStorage.setItem("lockoutUntil", until.toISOString());
            setLoading(false);
            Swal.fire({
              icon: "error",
              title: "Account Locked",
              text: `Too many failed attempts. Please try again in ${lockMinutes} minute(s).`,
            });
          } else {
            setFailedAttempts(newAttempts);
            sessionStorage.setItem("failedAttempts", newAttempts.toString());
            setLoading(false);
            Swal.fire({
              icon: "error",
              title: "Login Failed",
              text: "User not found or password incorrect",
            });
          }
        }
      } catch (error) {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong. Please try again.",
        });
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter email and password",
      });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem' }}>
        <div style={{ maxWidth: '380px', width: '100%' }}>
          <div className="text-center mb-4"><img src="/logo.png" alt="Logo" style={{ width: '120px' }} /><h2 className="mt-3 fw-bold login-heading">Sign in</h2></div>
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ borderRadius: '0.5rem' }} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password <span className="text-danger">*</span></Form.Label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required style={{ borderRadius: '0.5rem' }} />
            </Form.Group>
            <Button
              type="submit"
              disabled={loading || (lockoutUntil && new Date() < lockoutUntil)}
              style={{ backgroundColor: '#5044e4', border: 'none', width: '100%', borderRadius: '2rem', fontWeight: '700', padding: '0.75rem' }}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </Form>
        </div>
      </div>
      <div style={{ flex: '1 1 50%', backgroundImage: "url('/bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'left' }} className="d-none d-lg-flex">
        <div>
          <h1 className="hero-heading" style={{ fontSize: '3.5rem', fontWeight: '700' }}>School Management<br />System III</h1>
          <p className="hero-subheading">Class Scheduling System</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
