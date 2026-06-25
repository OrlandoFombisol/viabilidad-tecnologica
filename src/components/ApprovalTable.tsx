import React, { useMemo, useState } from 'react';
import type { TechItem } from '../types';
import ItemFormModal from './ItemFormModal';
import GridView from './GridView';
import '../styles/ApprovalTable.css';

interface ApprovalTableProps {
  items: TechItem[];
  canApprove: boolean;
  onUpdateItem: (id: string, changes: Partial<TechItem>) => void;
  onAddItem:    (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => void;
  onDeleteItem: (id: string) => void;
  onRenameArea: (oldArea: string, newArea: string) => void;
  onRenameSolicitante: (area: string, oldName: string, newName: string) => void;
  onResetAll: () => void;
}

type ModalState =
  | { mode: 'add'; defaultArea?: string }
  | { mode: 'edit'; item: TechItem }
  | null;

const ApprovalTable: React.FC<ApprovalTableProps> = ({
  items, canApprove, onUpdateItem, onAddItem, onDeleteItem,
  onRenameArea, onRenameSolicitante, onResetAll,
}) => {
  const areas = useMemo(() => Array.from(new Set(items.map(i => i.area))), [items]);
  const [query, setQuery]               = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [modal, setModal]               = useState<ModalState>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const filteredItems = normalizedQuery
    ? items.filter(i => `${i.area} ${i.solicitante} ${i.elemento}`.toLocaleLowerCase('es').includes(normalizedQuery))
    : items;

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    onResetAll();
    setConfirmReset(false);
  };

  const handleModalSubmit = (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => {
    if (!modal) return;
    if (modal.mode === 'add') {
      onAddItem(data);
    } else {
      const newCant = Math.min(modal.item.cantidadAprobada, data.cantidadSolicitada);
      onUpdateItem(modal.item.id, { ...data, cantidadAprobada: newCant });
    }
    setModal(null);
  };

  return (
    <section className="approval-section">

      {/* ── Hero header ── */}
      <div className="approval-hero">
        <div className="approval-hero-text">
          <span className="section-eyebrow">Detalle proveniente del levantamiento</span>
          <h2 className="section-title">Revisión de viabilidad por área y solicitante</h2>
          <p className="section-subtitle">Abra un área y registre la decisión para cada necesidad evaluada por Tecnología.</p>
        </div>
        <div className="table-actions">
          {canApprove && (
            <button className="btn btn-secondary" onClick={reset}>
              {confirmReset ? 'Confirmar limpieza' : 'Limpiar revisión'}
            </button>
          )}
          {!canApprove && (
            <button className="btn btn-add" onClick={() => setModal({ mode: 'add' })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nueva solicitud
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="review-toolbar">
        <label className="search-box" htmlFor="approval-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="approval-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por persona, área o elemento…"
            aria-label="Buscar solicitudes"
          />
        </label>
        <span className="area-count">{areas.length} áreas · {items.length} decisiones</span>
      </div>

      <GridView
        items={filteredItems}
        canApprove={canApprove}
        onUpdateItem={onUpdateItem}
        onAddItem={onAddItem}
        onDeleteItem={onDeleteItem}
        onRenameArea={onRenameArea}
        onRenameSolicitante={onRenameSolicitante}
        existingAreas={areas}
        onOpenEditModal={item => setModal({ mode: 'edit', item })}
      />

      {modal && (
        <ItemFormModal
          mode={modal.mode}
          item={modal.mode === 'edit' ? modal.item : undefined}
          existingAreas={areas}
          defaultArea={modal.mode === 'add' ? modal.defaultArea : undefined}
          onSubmit={handleModalSubmit}
          onDelete={modal.mode === 'edit' ? () => { onDeleteItem(modal.item.id); setModal(null); } : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
};

export default ApprovalTable;
