import { useState, useCallback } from 'react';
import type { TechItem } from '../types';

export interface Revision {
  id: string;
  fecha: string; // ISO
  items: TechItem[];
}

const KEY = 'vt_revisiones';

function load(): Revision[] {
  try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as Revision[]) : []; }
  catch { return []; }
}

function persist(revs: Revision[]) {
  try { localStorage.setItem(KEY, JSON.stringify(revs)); } catch { /* quota */ }
}

const MAIN_ID = 'rev-main';

export function useRevisiones() {
  const [revisiones, setRevisiones] = useState<Revision[]>(load);

  // Acumula los ítems aprobados en una sola revisión; la crea si no existe.
  const upsertRevision = useCallback((approvedItems: TechItem[]) => {
    setRevisiones(prev => {
      const existing = prev.find(r => r.id === MAIN_ID);
      const merged: Revision = {
        id: MAIN_ID,
        fecha: new Date().toISOString(),
        items: [
          ...(existing ? (JSON.parse(JSON.stringify(existing.items)) as TechItem[]) : []),
          ...(JSON.parse(JSON.stringify(approvedItems)) as TechItem[]),
        ],
      };
      const next = [merged];
      persist(next);
      return next;
    });
  }, []);

  const updateRevision = useCallback((id: string, updatedItems: TechItem[]) => {
    setRevisiones(prev => {
      const next = prev.map(r =>
        r.id === id ? { ...r, items: JSON.parse(JSON.stringify(updatedItems)) as TechItem[] } : r
      );
      persist(next);
      return next;
    });
  }, []);

  return { revisiones, upsertRevision, updateRevision };
}
