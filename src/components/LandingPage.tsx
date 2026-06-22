import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/LandingPage.css';

interface LandingPageProps {
  onEnter: () => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  initial: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.6 } },
};

const rise = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.85, ease },
  },
};

// Floating orb
function Orb({ className, dx, dy, duration, delay }: {
  className: string; dx: number[]; dy: number[]; duration: number; delay: number;
}) {
  return (
    <motion.div
      className={`lp-orb ${className}`}
      animate={{ x: dx, y: dy, scale: [1, 1.1, 0.93, 1.04, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay, times: [0, 0.25, 0.5, 0.75, 1] }}
    />
  );
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
  };

  return (
    <motion.div
      className={`lp-root${exiting ? '' : ' lp-root--in'}`}
      animate={exiting ? { opacity: 0, scale: 0.96, filter: 'blur(14px)' } : {}}
      transition={exiting ? { duration: 0.55, ease: [0.4, 0, 1, 1] } : {}}
      style={exiting ? {} : undefined}
      onAnimationComplete={() => { if (exiting) onEnter(); }}
    >
      {/* Orbs */}
      <div className="lp-bg">
        <Orb className="lp-orb-1" dx={[0, 45, -25, 10, 0]} dy={[0, -30, 50, -15, 0]} duration={20} delay={0} />
        <Orb className="lp-orb-2" dx={[0, -55, 35, -10, 0]} dy={[0, 45, -30, 20, 0]} duration={26} delay={3} />
        <Orb className="lp-orb-3" dx={[0, 20, -40, 15, 0]} dy={[0, -45, 25, -10, 0]} duration={18} delay={6} />
      </div>

      {/* Grid + grain + vignette */}
      <div className="lp-grid" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-vignette" aria-hidden="true" />

      {/* Main content */}
      <motion.div className="lp-content" variants={stagger} initial="initial" animate="visible">

        {/* Status badge */}
        <motion.div className="lp-top-badge" variants={rise}>
          <span className="lp-badge-dot" />
          Sistema Interno · Jefatura de Tecnología de la Información
        </motion.div>

        {/* Logo */}
        <motion.div
          className="lp-logo"
          initial={{ scale: 0.45, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" width="44" height="44" aria-hidden="true">
              <rect x="3" y="7" width="42" height="28" rx="4" />
              <path d="M15 43h18M24 35v8" />
              <path d="M12 18l6 6-6 6" />
              <path d="M23 24h12" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Title */}
        <div className="lp-title" aria-label="Solicitud de Viabilidad Tecnológica">
          <motion.span className="lp-title-word lp-accent" variants={rise}>
            Solicitud de
          </motion.span>
          <motion.span className="lp-title-word" variants={rise}>
            Viabilidad
          </motion.span>
          <motion.span className="lp-title-word" variants={rise}>
            Tecnológica
          </motion.span>
        </div>

        {/* Subtitle */}
        <motion.p className="lp-subtitle" variants={rise}>
          Revisión y aprobación gerencial de necesidades tecnológicas<br />
          consolidadas por la Jefatura de Tecnología de la Información.
        </motion.p>

        {/* Stats */}
        <motion.div className="lp-stats" variants={rise}>
          <div className="lp-stat">
            <span className="lp-stat-num">33+</span>
            <span className="lp-stat-label">Solicitudes</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-num">12</span>
            <span className="lp-stat-label">Áreas</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-num">2</span>
            <span className="lp-stat-label">Roles de acceso</span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div className="lp-cta-wrap" variants={rise}>
          <motion.button
            className="lp-cta"
            onClick={handleEnter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label="Ingresar al sistema"
          >
            <span className="lp-cta-label">
              Ingresar al sistema
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.span>
            </span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p className="lp-footer-text" variants={rise}>
          Acceso restringido · Uso interno corporativo · 2026
        </motion.p>

      </motion.div>
    </motion.div>
  );
};

export default LandingPage;
