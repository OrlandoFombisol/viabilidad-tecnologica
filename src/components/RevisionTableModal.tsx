import React, { useState, useMemo, useCallback } from 'react';
import type { TechItem } from '../types';
import type { Revision } from '../hooks/useRevisiones';
import GridView from './GridView';
import ItemFormModal from './ItemFormModal';
import '../styles/RevisionTableModal.css';

type ModalState = { mode: 'add'; defaultArea?: string } | { mode: 'edit'; item: TechItem } | null;

interface Props {
  revision: Revision;
  onSave: (updatedItems: TechItem[]) => void;
  onClose: () => void;
}

const RevisionTableModal: React.FC<Props> = ({ revision, onSave, onClose }) => {
  const [items, setItems] = useState<TechItem[]>(() =>
    JSON.parse(JSON.stringify(revision.items)) as TechItem[]
  );
  const [modal, setModal] = useState<ModalState>(null);

  const fecha = new Date(revision.fecha).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hora = new Date(revision.fecha).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  });

  const areas = useMemo(() => Array.from(new Set(items.map(i => i.area))), [items]);

  const updateItem = useCallback((id: string, changes: Partial<TechItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  }, []);

  const addItem = useCallback((data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => {
    const newItem: TechItem = {
      ...data,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      estado: 'Pendiente',
      cantidadAprobada: 0,
      comentarioGerencia: '',
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const renameArea = useCallback((oldArea: string, newArea: string) => {
    const t = newArea.trim();
    if (!t || t === oldArea) return;
    setItems(prev => prev.map(i => i.area === oldArea ? { ...i, area: t } : i));
  }, []);

  const renameSolicitante = useCallback((area: string, oldName: string, newName: string) => {
    const t = newName.trim();
    if (!t || t === oldName) return;
    setItems(prev => prev.map(i =>
      i.area === area && i.solicitante === oldName ? { ...i, solicitante: t } : i
    ));
  }, []);

  const handleModalSubmit = (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => {
    if (!modal) return;
    if (modal.mode === 'add') {
      addItem(data);
    } else {
      const newCant = Math.min(modal.item.cantidadAprobada, data.cantidadSolicitada);
      updateItem(modal.item.id, { ...data, cantidadAprobada: newCant });
    }
    setModal(null);
  };

  const handleSave = () => { onSave(items); onClose(); };

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
          </div>
          <div className="rtm-header-actions">
            <button className="btn rtm-btn-save" onClick={handleSave}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Guardar cambios
            </button>
            <button className="btn rtm-btn-close" onClick={onClose}>
              Cerrar sin guardar
            </button>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="rtm-toolbar">
          <button className="btn btn-add" onClick={() => setModal({ mode: 'add' })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Agregar ítem
          </button>
          <span className="rtm-info-badge">{items.length} ítems</span>
        </div>

        {/* Tabla */}
        <div className="rtm-body">
          <GridView
            items={items}
            canApprove={true}
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onRenameArea={renameArea}
            onRenameSolicitante={renameSolicitante}
            onOpenEditModal={item => setModal({ mode: 'edit', item })}
            existingAreas={areas}
          />
        </div>
      </div>

      {/* Modal de ítem (editar / agregar) */}
      {modal && (
        <ItemFormModal
          mode={modal.mode}
          item={modal.mode === 'edit' ? modal.item : undefined}
          existingAreas={areas}
          defaultArea={modal.mode === 'add' ? modal.defaultArea : undefined}
          onSubmit={handleModalSubmit}
          onDelete={modal.mode === 'edit' ? () => { deleteItem(modal.item.id); setModal(null); } : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default RevisionTableModal;
