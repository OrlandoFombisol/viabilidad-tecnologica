import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/LandingPage.css';

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1600;
    const start = performance.now();
    const raf = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{val}{suffix}</>;
}

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  initial: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
};

const rise = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease } },
};

const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [exiting, setExiting] = useState(false);
  const [statsOn, setStatsOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStatsOn(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => { if (!exiting) setExiting(true); };

  return (
    <motion.div
      className={`lp-root${exiting ? '' : ' lp-root--in'}`}
      animate={exiting ? { opacity: 0, scale: 0.96, filter: 'blur(14px)' } : {}}
      transition={exiting ? { duration: 0.52, ease: [0.4, 0, 1, 1] } : {}}
      onAnimationComplete={() => { if (exiting) onEnter(); }}
    >
      {/* Fondo animado */}
      <div className="lp-bg" aria-hidden="true">
        <motion.div className="lp-blob lp-blob-1"
          animate={{ x: [0, 40, -20, 0], y: [0, -25, 40, 0], scale: [1, 1.1, 0.94, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="lp-blob lp-blob-2"
          animate={{ x: [0, -50, 25, 0], y: [0, 35, -30, 0], scale: [1, 0.92, 1.08, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
        <motion.div className="lp-blob lp-blob-3"
          animate={{ x: [0, 20, -35, 0], y: [0, -40, 18, 0], scale: [1, 1.06, 0.97, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 7 }} />
        <div className="lp-grid" />
        <div className="lp-vignette" />
      </div>

      {/* Líneas decorativas */}
      <div className="lp-deco" aria-hidden="true">
        <motion.div className="lp-deco-ring lp-deco-ring-1"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="lp-deco-ring lp-deco-ring-2"
          animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }} />
      </div>

      {/* Contenido */}
      <motion.div className="lp-content" variants={stagger} initial="initial" animate="visible">

        {/* Badge */}
        <motion.div className="lp-badge" variants={rise}>
          <span className="lp-badge-dot" />
          <span>Sistema Interno · Departamento de Tecnología de la Información</span>
          <span className="lp-badge-shimmer" aria-hidden="true" />
        </motion.div>

        {/* Logo */}
        <motion.div
          className="lp-logo"
          initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.15, ease }}
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" width="46" height="46" aria-hidden="true">
              <rect x="3" y="7" width="42" height="28" rx="5" />
              <path d="M15 43h18M24 35v8" />
              <path d="M12 19l6 5-6 5" />
              <path d="M23 24h13" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Título */}
        <div className="lp-title" aria-label="Solicitud de Viabilidad Tecnológica">
          <motion.span className="lp-title-pre" variants={rise}>Solicitud de</motion.span>
          <motion.span className="lp-title-main" variants={rise}>Viabilidad</motion.span>
          <motion.span className="lp-title-main lp-title-accent" variants={rise}>Tecnológica</motion.span>
        </div>

        {/* Subtítulo */}
        <motion.p className="lp-subtitle" variants={rise}>
          Revisión y aprobación gerencial de necesidades tecnológicas
          consolidadas por el Departamento de Tecnología de la Información.
        </motion.p>

        {/* Stats */}
        <motion.div className="lp-stats" variants={rise}>
          {[
            { value: 33, suffix: '+', label: 'Solicitudes' },
            { value: 12, suffix: '',  label: 'Áreas' },
            { value: 2,  suffix: '',  label: 'Roles de acceso' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="lp-stat-sep" />}
              <div className="lp-stat">
                <span className="lp-stat-n">
                  {statsOn ? <AnimatedNumber target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
                </span>
                <span className="lp-stat-l">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={rise}>
          <motion.button
            className="lp-cta"
            onClick={handleEnter}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <span className="lp-cta-shine" aria-hidden="true" />
            <span className="lp-cta-text">
              Ingresar al sistema
              <motion.svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                width="17" height="17" aria-hidden="true"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p className="lp-footer" variants={rise}>
          Acceso restringido · Uso interno corporativo · Fombisol 2026
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default LandingPage;
