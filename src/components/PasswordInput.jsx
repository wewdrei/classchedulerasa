import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

// Reusable password input with show/hide toggle. Forwards all props to Form.Control.
export default function PasswordInput(props) {
  const { className = '', size, style, ...rest } = props;
  const [show, setShow] = useState(false);

  const toggle = (e) => {
    e.preventDefault();
    setShow((s) => !s);
  };

  const wrapperStyle = {
    position: 'relative',
    width: '100%'
  };

  const controlStyle = {
    paddingRight: '2.5rem',
    ...(style || {}),
  };

  const buttonStyle = {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    color: '#6c757d',
    padding: 0,
    lineHeight: 1,
  };

  return (
    <div className={className} style={wrapperStyle}>
      <Form.Control
        type={show ? 'text' : 'password'}
        size={size}
        style={controlStyle}
        {...rest}
      />
      <button
        type="button"
        onClick={toggle}
        title={show ? 'Hide password' : 'Show password'}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={buttonStyle}
      >
        <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
      </button>
    </div>
  );
}
