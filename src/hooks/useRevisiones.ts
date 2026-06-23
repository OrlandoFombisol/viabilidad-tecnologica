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

export function useRevisiones() {
  const [revisiones, setRevisiones] = useState<Revision[]>(load);

  const addRevision = useCallback((items: TechItem[]): Revision => {
    const rev: Revision = {
      id: `rev-${Date.now()}`,
      fecha: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(items)) as TechItem[],
    };
    setRevisiones(prev => { const next = [rev, ...prev]; persist(next); return next; });
    return rev;
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

  return { revisiones, addRevision, updateRevision };
}
