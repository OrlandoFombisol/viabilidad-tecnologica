import React, { useState } from 'react';
import type { TechItem, Priority } from '../types';
import '../styles/ItemFormModal.css';

const ELEMENTO_TEMPLATES: Record<string, { categoria: string; prioridad: Priority; justificacion: string }> = {
  'Teclado':           { categoria: 'Puesto de trabajo',  prioridad: 'Alta',  justificacion: 'Reposición o dotación requerida para el puesto de trabajo.' },
  'Base para portátil':{ categoria: 'Puesto de trabajo',  prioridad: 'Media', justificacion: 'Adecuación ergonómica del puesto de trabajo.' },
  'Mouse':             { categoria: 'Puesto de trabajo',  prioridad: 'Alta',  justificacion: 'Reposición o dotación requerida para la operación diaria.' },
  'Mousepad':          { categoria: 'Puesto de trabajo',  prioridad: 'Media', justificacion: 'Complemento para la adecuada operación del puesto de trabajo.' },
  'PC / Laptop':       { categoria: 'Equipo de cómputo',  prioridad: 'Alta',  justificacion: 'Asignación o renovación de equipo según evaluación de la necesidad del usuario.' },
  'Pantalla':          { categoria: 'Equipo de cómputo',  prioridad: 'Alta',  justificacion: 'Ampliación o reposición de pantalla para el puesto de trabajo.' },
  'PC All in One':     { categoria: 'Equipo de cómputo',  prioridad: 'Alta',  justificacion: 'Estación completa requerida según la función y condiciones del puesto.' },
};

const ELEMENTOS_SUGERIDOS = Object.keys(ELEMENTO_TEMPLATES);

type FormData = {
  area: string;
  solicitante: string;
  elemento: string;
  categoria: string;
  prioridad: Priority;
  cantidadSolicitada: number;
  justificacion: string;
};

interface ItemFormModalProps {
  mode: 'add' | 'edit';
  item?: TechItem;
  existingAreas: string[];
  defaultArea?: string;
  defaultSolicitante?: string;
  defaultElemento?: string;
  onSubmit: (data: Omit<TechItem, 'id' | 'estado' | 'cantidadAprobada' | 'comentarioGerencia'>) => void;
  onClose: () => void;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  mode, item, existingAreas, defaultArea, defaultSolicitante, defaultElemento, onSubmit, onClose,
}) => {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === 'edit' && item) {
      return { area: item.area, solicitante: item.solicitante, elemento: item.elemento, categoria: item.categoria, prioridad: item.prioridad, cantidadSolicitada: item.cantidadSolicitada, justificacion: item.justificacion };
    }
    const tpl = defaultElemento ? ELEMENTO_TEMPLATES[defaultElemento] : null;
    return {
      area: defaultArea ?? '',
      solicitante: defaultSolicitante ?? '',
      elemento: defaultElemento ?? '',
      categoria: tpl?.categoria ?? '',
      prioridad: (tpl?.prioridad ?? 'Media') as Priority,
      cantidadSolicitada: 1,
      justificacion: tpl?.justificacion ?? '',
    };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleElemento = (value: string) => {
    const tpl = ELEMENTO_TEMPLATES[value];
    if (tpl) {
      setForm(prev => ({ ...prev, elemento: value, categoria: tpl.categoria, prioridad: tpl.prioridad, justificacion: tpl.justificacion }));
    } else {
      setField('elemento', value);
    }
    setErrors(prev => ({ ...prev, elemento: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.area.trim())         e.area         = 'Obligatorio';
    if (!form.solicitante.trim())  e.solicitante  = 'Obligatorio';
    if (!form.elemento.trim())     e.elemento     = 'Obligatorio';
    if (!form.categoria.trim())    e.categoria    = 'Obligatorio';
    if (!form.justificacion.trim())e.justificacion= 'Obligatorio';
    if (form.cantidadSolicitada < 1) e.cantidadSolicitada = 'Mínimo 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      area: form.area.trim(),
      solicitante: form.solicitante.trim(),
      elemento: form.elemento.trim(),
      categoria: form.categoria.trim(),
      prioridad: form.prioridad,
      cantidadSolicitada: form.cantidadSolicitada,
      justificacion: form.justificacion.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box item-form-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'add' ? 'Nueva solicitud' : 'Editar solicitud'}
      >
        <div className="ifm-header">
          <div>
            <span className="ifm-kicker">{mode === 'add' ? 'Nueva solicitud' : 'Editar solicitud'}</span>
            <h3 className="ifm-title">{mode === 'add' ? 'Agregar ítem al levantamiento' : 'Modificar datos del ítem'}</h3>
          </div>
          <button className="ifm-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ifm-body" noValidate>
          {/* Fila 1: Área + Solicitante */}
          <div className="ifm-row-2">
            <div className="ifm-field">
              <label htmlFor="ifm-area">Área / Departamento</label>
              <input
                id="ifm-area"
                list="ifm-areas-list"
                value={form.area}
                onChange={e => setField('area', e.target.value)}
                placeholder="Ej: Contabilidad"
                className={errors.area ? 'has-error' : ''}
                autoFocus
              />
              <datalist id="ifm-areas-list">
                {existingAreas.map(a => <option key={a} value={a} />)}
              </datalist>
              {errors.area && <span className="ifm-error">{errors.area}</span>}
            </div>
            <div className="ifm-field">
              <label htmlFor="ifm-solicitante">Solicitante</label>
              <input
                id="ifm-solicitante"
                value={form.solicitante}
                onChange={e => setField('solicitante', e.target.value)}
                placeholder="Nombre completo"
                className={errors.solicitante ? 'has-error' : ''}
              />
              {errors.solicitante && <span className="ifm-error">{errors.solicitante}</span>}
            </div>
          </div>

          {/* Fila 2: Elemento + Cantidad */}
          <div className="ifm-row-2">
            <div className="ifm-field">
              <label htmlFor="ifm-elemento">Elemento</label>
              <input
                id="ifm-elemento"
                list="ifm-elementos-list"
                value={form.elemento}
                onChange={e => handleElemento(e.target.value)}
                placeholder="Seleccione o escriba"
                className={errors.elemento ? 'has-error' : ''}
              />
              <datalist id="ifm-elementos-list">
                {ELEMENTOS_SUGERIDOS.map(el => <option key={el} value={el} />)}
              </datalist>
              {errors.elemento && <span className="ifm-error">{errors.elemento}</span>}
            </div>
            <div className="ifm-field">
              <label htmlFor="ifm-cantidad">Cantidad solicitada</label>
              <input
                id="ifm-cantidad"
                type="number"
                min={1}
                value={form.cantidadSolicitada}
                onChange={e => setField('cantidadSolicitada', Math.max(1, parseInt(e.target.value) || 1))}
                className={errors.cantidadSolicitada ? 'has-error' : ''}
              />
              {errors.cantidadSolicitada && <span className="ifm-error">{errors.cantidadSolicitada}</span>}
            </div>
          </div>

          {/* Fila 3: Categoría + Prioridad */}
          <div className="ifm-row-2">
            <div className="ifm-field">
              <label htmlFor="ifm-categoria">Categoría</label>
              <input
                id="ifm-categoria"
                value={form.categoria}
                onChange={e => setField('categoria', e.target.value)}
                placeholder="Ej: Puesto de trabajo"
                className={errors.categoria ? 'has-error' : ''}
              />
              {errors.categoria && <span className="ifm-error">{errors.categoria}</span>}
            </div>
            <div className="ifm-field">
              <label htmlFor="ifm-prioridad">Prioridad</label>
              <select
                id="ifm-prioridad"
                value={form.prioridad}
                onChange={e => setField('prioridad', e.target.value as Priority)}
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          {/* Justificación */}
          <div className="ifm-field">
            <label htmlFor="ifm-justificacion">Justificación</label>
            <textarea
              id="ifm-justificacion"
              value={form.justificacion}
              onChange={e => setField('justificacion', e.target.value)}
              rows={3}
              placeholder="Descripción de la necesidad"
              className={errors.justificacion ? 'has-error' : ''}
            />
            {errors.justificacion && <span className="ifm-error">{errors.justificacion}</span>}
          </div>

          <div className="ifm-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'add' ? 'Agregar solicitud' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;
