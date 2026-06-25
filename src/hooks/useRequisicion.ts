import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { TechItem } from '../types';
import { initialItems } from '../data/initialData';

type SolicitudInsert = Database['public']['Tables']['solicitudes']['Insert'];

const STORAGE_KEY = 'viabilidad_tecnologica_v2';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

type DbRow = {
  id: string;
  area: string;
  solicitante: string;
  categoria: string;
  elemento: string;
  cantidad_solicitada: number;
  justificacion: string;
  prioridad: string;
  estado: string;
  cantidad_aprobada: number;
  comentario_gerencia: string;
  urgente: boolean;
  ultimo_modificado_por: string | null;
  ultimo_modificado_at: string | null;
  created_at?: string;
};

function rowToItem(row: DbRow): TechItem {
  return {
    id: row.id,
    area: row.area,
    solicitante: row.solicitante,
    categoria: row.categoria,
    elemento: row.elemento,
    cantidadSolicitada: row.cantidad_solicitada,
    justificacion: row.justificacion,
    prioridad: row.prioridad as TechItem['prioridad'],
    estado: row.estado as TechItem['estado'],
    cantidadAprobada: row.cantidad_aprobada,
    comentarioGerencia: row.comentario_gerencia,
    urgente: row.urgente,
    ultimoModificadoPor: row.ultimo_modificado_por ?? undefined,
    ultimoModificadoAt: row.ultimo_modificado_at ?? undefined,
  };
}

function itemToRow(item: TechItem, email: string | null | undefined): SolicitudInsert {
  return {
    id: item.id,
    area: item.area,
    solicitante: item.solicitante,
    categoria: item.categoria,
    elemento: item.elemento,
    cantidad_solicitada: item.cantidadSolicitada,
    justificacion: item.justificacion,
    prioridad: item.prioridad,
    estado: item.estado,
    cantidad_aprobada: item.cantidadAprobada,
    comentario_gerencia: item.comentarioGerencia,
    urgente: item.urgente ?? false,
    ultimo_modificado_por: email ?? null,
    ultimo_modificado_at: new Date().toISOString(),
  };
}

function loadLocalStorage(): TechItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TechItem[];
  } catch { /* ignorar */ }
  return initialItems.map(i => ({ ...i }));
}

export function useRequisicion(userEmail: string | null | undefined) {
  const [items, setItems] = useState<TechItem[]>(loadLocalStorage);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [dbReady, setDbReady] = useState(false);

  const itemsRef = useRef<TechItem[]>(items);
  const userEmailRef = useRef(userEmail);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { userEmailRef.current = userEmail; }, [userEmail]);

  // Respaldo automático en localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota */ }
  }, [items]);

  const markSaved = useCallback(() => {
    setSyncStatus('saved');
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSyncStatus('idle'), 3000);
  }, []);

  // Guardar un ítem individual en Supabase
  const saveOne = useCallback(async (item: TechItem): Promise<boolean> => {
    setSyncStatus('saving');
    const { error } = await supabase
      .from('solicitudes')
      .upsert(itemToRow(item, userEmailRef.current), { onConflict: 'id' });
    if (error) { setSyncStatus('error'); return false; }
    markSaved();
    return true;
  }, [markSaved]);

  // Guardar todos los ítems en Supabase
  const saveAll = useCallback(async (list: TechItem[]): Promise<boolean> => {
    setSyncStatus('saving');
    const { error } = await supabase
      .from('solicitudes')
      .upsert(list.map(i => itemToRow(i, userEmailRef.current)), { onConflict: 'id' });
    if (error) { setSyncStatus('error'); return false; }
    markSaved();
    return true;
  }, [markSaved]);

  // Carga inicial desde Supabase
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSyncStatus('saving');

      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        // Sin conexión: usar localStorage
        setSyncStatus('offline');
        setDbReady(true);
        return;
      }

      if (!data || data.length === 0) {
        // Supabase vacío: sembrar datos iniciales (idempotente)
        const rows = initialItems.map(i => itemToRow(i, null));
        const { error: seedErr } = await supabase
          .from('solicitudes')
          .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

        if (!cancelled) {
          if (!seedErr) {
            setItems(initialItems.map(i => ({ ...i })));
            markSaved();
          } else {
            setSyncStatus('error');
          }
          setDbReady(true);
        }
      } else {
        if (!cancelled) {
          setItems(data.map(r => rowToItem(r as DbRow)));
          markSaved();
          setDbReady(true);
        }
      }
    }

    void init();
    return () => { cancelled = true; };
  }, [markSaved]);

  // Suscripción Realtime
  useEffect(() => {
    if (!dbReady) return;

    const channel = supabase
      .channel('solicitudes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const changed = rowToItem(payload.new as DbRow);
            setItems(prev => {
              const exists = prev.some(i => i.id === changed.id);
              if (exists) return prev.map(i => i.id === changed.id ? changed : i);
              return [...prev, changed];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) setItems(prev => prev.filter(i => i.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [dbReady]);

  const updateItem = useCallback((id: string, changes: Partial<TechItem>) => {
    const existing = itemsRef.current.find(i => i.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changes };
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    void saveOne(updated);
  }, [saveOne]);

  const addItem = useCallback((data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => {
    const newItem: TechItem = {
      ...data,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      estado: 'Pendiente',
      cantidadAprobada: 0,
      comentarioGerencia: '',
    };
    setItems(prev => [...prev, newItem]);
    void saveOne(newItem);
  }, [saveOne]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSyncStatus('saving');
    void supabase
      .from('solicitudes')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) setSyncStatus('error');
        else markSaved();
      });
  }, [markSaved]);

  const approveAll = useCallback(() => {
    const next = itemsRef.current.map(item => ({
      ...item,
      estado: 'Aprobado' as const,
      cantidadAprobada: item.cantidadSolicitada,
    }));
    setItems(next);
    void saveAll(next);
  }, [saveAll]);

  const resetAll = useCallback(async () => {
    const fresh = initialItems.map(i => ({ ...i }));
    setItems(fresh);
    localStorage.removeItem(STORAGE_KEY);
    setSyncStatus('saving');

    const rows = fresh.map(i => itemToRow(i, userEmailRef.current));
    const { error: upsertErr } = await supabase
      .from('solicitudes')
      .upsert(rows, { onConflict: 'id' });
    if (upsertErr) { setSyncStatus('error'); return; }

    // Eliminar ítems personalizados
    const { error: delErr } = await supabase
      .from('solicitudes')
      .delete()
      .like('id', 'custom-%');
    if (delErr) { setSyncStatus('error'); return; }

    markSaved();
  }, [markSaved]);

  const renameArea = useCallback(async (oldArea: string, newArea: string) => {
    const trimmed = newArea.trim();
    if (!trimmed || trimmed === oldArea) return;
    setItems(prev => prev.map(i => i.area === oldArea ? { ...i, area: trimmed } : i));
    setSyncStatus('saving');
    const { error } = await supabase
      .from('solicitudes')
      .update({ area: trimmed })
      .eq('area', oldArea);
    if (error) setSyncStatus('error');
    else markSaved();
  }, [markSaved]);

  const renameSolicitante = useCallback(async (area: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setItems(prev => prev.map(i =>
      i.area === area && i.solicitante === oldName ? { ...i, solicitante: trimmed } : i
    ));
    setSyncStatus('saving');
    const { error } = await supabase
      .from('solicitudes')
      .update({ solicitante: trimmed })
      .eq('area', area)
      .eq('solicitante', oldName);
    if (error) setSyncStatus('error');
    else markSaved();
  }, [markSaved]);

  const replaceItems = useCallback(async (newItems: TechItem[]) => {
    const oldIds = new Set(itemsRef.current.map(i => i.id));
    const newIds = new Set(newItems.map(i => i.id));
    const toDelete = [...oldIds].filter(id => !newIds.has(id));

    setItems(newItems);
    setSyncStatus('saving');

    if (toDelete.length > 0) {
      await supabase.from('solicitudes').delete().in('id', toDelete);
    }
    if (newItems.length > 0) {
      const { error } = await supabase
        .from('solicitudes')
        .upsert(newItems.map(i => itemToRow(i, userEmailRef.current)), { onConflict: 'id' });
      if (error) { setSyncStatus('error'); return; }
    }
    markSaved();
  }, [markSaved]);

  const clearAll = useCallback(async () => {
    const ids = itemsRef.current.map(i => i.id);
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    if (ids.length === 0) { markSaved(); return; }
    setSyncStatus('saving');
    const { error } = await supabase.from('solicitudes').delete().in('id', ids);
    if (error) setSyncStatus('error');
    else markSaved();
  }, [markSaved]);

  const manualSave = useCallback(() => {
    void saveAll(itemsRef.current);
  }, [saveAll]);

  return {
    items,
    syncStatus,
    dbReady,
    updateItem,
    addItem,
    deleteItem,
    renameArea,
    renameSolicitante,
    approveAll,
    resetAll,
    clearAll,
    replaceItems,
    manualSave,
  };
}
