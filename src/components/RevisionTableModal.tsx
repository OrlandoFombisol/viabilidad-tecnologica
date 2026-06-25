import React, { useMemo } from 'react';
import type { Revision } from '../hooks/useRevisiones';
import { exportToExcel } from '../utils/excelExport';
import GridView from './GridView';
import '../styles/RevisionTableModal.css';

interface Props {
  revision: Revision;
  onClose: () => void;
}

const RevisionTableModal: React.FC<Props> = ({ revision, onClose }) => {
  const fecha = new Date(revision.fecha).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hora = new Date(revision.fecha).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  });

  const areas = useMemo(() => Array.from(new Set(revision.items.map(i => i.area))), [revision.items]);

  const handleExport = () => {
    exportToExcel(revision.items);
  };

  return (
    <div className="rtm-overlay">
      <div className="rtm-box">
        {/* Cabecera */}
        <div className="rtm-header">
          <div className="rtm-header-info">
            <span className="rtm-kicker">Revisión histórica · {hora}</span>
            <h2 className="rtm-title">
              {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
            </h2>
            <span className="rtm-readonly-badge">Solo lectura · {revision.items.length} ítems aprobados</span>
          </div>
          <div className="rtm-header-actions">
            <button className="btn btn-primary" onClick={handleExport}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="12" y2="18"/>
                <line x1="15" y1="15" x2="12" y2="18"/>
              </svg>
              Exportar Excel
            </button>
            <button className="btn rtm-btn-close" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabla — solo lectura */}
        <div className="rtm-body">
          <GridView
            items={revision.items}
            canApprove={false}
            viewOnly={true}
            onUpdateItem={() => {}}
            onAddItem={() => {}}
            onDeleteItem={() => {}}
            onRenameArea={() => {}}
            onRenameSolicitante={() => {}}
            onOpenEditModal={() => {}}
            existingAreas={areas}
          />
        </div>
      </div>
    </div>
  );
};

export default RevisionTableModal;
