import React, { useState } from 'react';

export default function AIAnalyzeButton({ program, className = '', size = 'sm' }) {
  const [animating, setAnimating] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const handleClick = () => {
    // Start animation / visual feedback
    setAnimating(true);
    setShowBadge(true);

    // After a short delay, dispatch the event to open the AI analysis modal
    setTimeout(() => {
      // normalize program payload so listeners get consistent fields
      const normalized = {
        ...program,
        // provide both id and program_id for maximum compatibility
        id: program?.id ?? program?.program_id ?? program?.programId ?? null,
        program_id: program?.program_id ?? program?.id ?? program?.programId ?? null,
        name: program?.name ?? program?.program_name ?? program?.programName ?? '',
        code: program?.code ?? program?.program_code ?? program?.programCode ?? ''
      };
      window.dispatchEvent(new CustomEvent('open-ai-analysis', { detail: { program: normalized } }));
    }, 550); // allow a half-second for the visual cue

    // Stop animation shortly after
    setTimeout(() => {
      setAnimating(false);
    }, 900);

    // Hide floating badge a bit later
    setTimeout(() => setShowBadge(false), 2200);
  };

  const baseClass = `btn btn-outline-primary btn-${size} ${className}`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={baseClass}
        onClick={handleClick}
        style={{
          transition: 'box-shadow 160ms ease, transform 160ms ease',
          boxShadow: animating ? '0 6px 20px rgba(99,102,241,0.35)' : undefined,
          transform: animating ? 'translateY(-2px) scale(1.02)' : undefined,
        }}
      >
        <i className="bi bi-robot me-2"></i>
        <span style={{ fontWeight: 600 }}>Analyze with AI</span>
      </button>

      {/* floating attention badge */}
      {showBadge && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -8,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontWeight: 700,
          boxShadow: '0 6px 18px rgba(99,102,241,0.2)',
          transform: 'translateY(-4px)',
          animation: 'ai-pulse 1.6s ease-in-out infinite'
        }}>Analyzing…</div>
      )}

      <style>{`
        @keyframes ai-pulse {
          0% { transform: translateY(-4px) scale(1); opacity: 1 }
          50% { transform: translateY(-6px) scale(1.03); opacity: 0.95 }
          100% { transform: translateY(-4px) scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  );
}
