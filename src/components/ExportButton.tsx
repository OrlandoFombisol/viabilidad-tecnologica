import React, { useState } from 'react';
import type { TechItem } from '../types';
import type { SyncStatus } from '../hooks/useRequisicion';
import type { UserRole } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelExport';
import SyncIndicator from './SyncIndicator';
import '../styles/ExportButton.css';

interface ExportButtonProps {
  items: TechItem[];
  syncStatus: SyncStatus;
  role: UserRole | null;
  onSave: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ items, syncStatus, role, onSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const approvedCount = items.filter(
    (i) => i.estado === 'Aprobado' || i.estado === 'Aprobado parcial'
  ).length;
  const pendingCount = items.filter((i) => i.estado === 'Pendiente').length;

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    try {
      exportToExcel(items);
      showToast('Excel completo generado con todas las áreas y solicitantes.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al generar el archivo.', 'error');
    }
  };

  return (
    <>
      <div className="export-bar">
        <div className="export-bar-left">
          <div className="export-status-text">
            {approvedCount > 0 ? (
              <span className="ready-label">
                Revisión completa disponible · {approvedCount} {approvedCount === 1 ? 'registro aprobado' : 'registros aprobados'} para Compras
              </span>
            ) : (
              <span className="not-ready-label">
                Revisión completa disponible · Sin registros aprobados para Compras
              </span>
            )}
          </div>
          <SyncIndicator status={syncStatus} />
        </div>
        <div className="export-bar-actions">
          <button className="btn btn-outline" onClick={() => window.print()} title="Imprimir o guardar como PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M6 9V2h12v7" /><rect x="6" y="14" width="12" height="8" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            </svg>
            Imprimir / PDF
          </button>
          {role === 'gerencia' && (
            <button className="btn btn-secondary" onClick={onSave} disabled={syncStatus === 'saving'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar revisión
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowConfirm(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="12" y2="18" /><line x1="15" y1="15" x2="12" y2="18" />
            </svg>
            Generar Excel completo
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3 className="modal-title">Generar revisión completa</h3>
            <p className="modal-body">
              El archivo incluirá las <strong>{items.length} solicitudes de todas las áreas y
              solicitantes</strong>. También contendrá una hoja separada con los{' '}
              <strong>{approvedCount} registros aprobados para Compras</strong>.
              {pendingCount > 0 && <> Actualmente hay <strong>{pendingCount} decisiones pendientes</strong>, que se conservarán identificadas en la revisión completa.</>}
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Generar Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </>
  );
};

export default ExportButton;
