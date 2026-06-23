import type { Priority, TechItem } from '../types';

type SourceRequest = {
  area: string;
  solicitante: string;
  necesidades: Partial<Record<ItemKey, number>>;
};

type ItemKey = 'teclado' | 'base' | 'mouse' | 'mousepad' | 'laptop' | 'pantalla' | 'allInOne';

const itemDefinitions: Record<ItemKey, {
  elemento: string;
  categoria: string;
  prioridad: Priority;
  justificacion: string;
}> = {
  teclado: {
    elemento: 'Teclado', categoria: 'Puesto de trabajo', prioridad: 'Alta',
    justificacion: 'Reposición o dotación requerida para el puesto de trabajo.',
  },
  base: {
    elemento: 'Base para portátil', categoria: 'Puesto de trabajo', prioridad: 'Media',
    justificacion: 'Adecuación ergonómica del puesto de trabajo.',
  },
  mouse: {
    elemento: 'Mouse', categoria: 'Puesto de trabajo', prioridad: 'Alta',
    justificacion: 'Reposición o dotación requerida para la operación diaria.',
  },
  mousepad: {
    elemento: 'Mousepad', categoria: 'Puesto de trabajo', prioridad: 'Media',
    justificacion: 'Complemento para la adecuada operación del puesto de trabajo.',
  },
  laptop: {
    elemento: 'PC / Laptop', categoria: 'Equipo de cómputo', prioridad: 'Alta',
    justificacion: 'Asignación o renovación de equipo según evaluación de la necesidad del usuario.',
  },
  pantalla: {
    elemento: 'Pantalla', categoria: 'Equipo de cómputo', prioridad: 'Alta',
    justificacion: 'Ampliación o reposición de pantalla para el puesto de trabajo.',
  },
  allInOne: {
    elemento: 'PC All in One', categoria: 'Equipo de cómputo', prioridad: 'Alta',
    justificacion: 'Estación completa requerida según la función y condiciones del puesto.',
  },
};

const sourceRequests: SourceRequest[] = [
  { area: 'Contabilidad', solicitante: 'Maria Camila Cabrera', necesidades: { teclado: 1 } },
  { area: 'Contabilidad', solicitante: 'Jefry Roca', necesidades: { teclado: 1, mousepad: 1 } },
  { area: 'Contabilidad', solicitante: 'Danisa Jassir', necesidades: { teclado: 1, laptop: 1 } },
  { area: 'Contabilidad', solicitante: 'Rossy Ferrer', necesidades: { teclado: 1, mousepad: 1 } },
  { area: 'Contabilidad', solicitante: 'Kelly Pacheco', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Contabilidad', solicitante: 'Saray Alejandra', necesidades: { teclado: 1, mouse: 1 } },
  { area: 'Contabilidad', solicitante: 'Luz Castro', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, pantalla: 1 } },
  { area: 'Contabilidad', solicitante: 'Victor Suarez', necesidades: { teclado: 1, pantalla: 1 } },
  { area: 'Contabilidad', solicitante: 'Tatiana Galvis', necesidades: { teclado: 1, base: 1 } },
  { area: 'Contabilidad', solicitante: 'Carolay Barrios', necesidades: { mousepad: 1 } },
  { area: 'Contabilidad', solicitante: 'Milnena Velez', necesidades: { mousepad: 1 } },
  { area: 'Contabilidad', solicitante: 'Jeferson Coen', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Gestión Humana', solicitante: 'Jesus Martinez', necesidades: { teclado: 1, mouse: 1, mousepad: 1 } },
  { area: 'Gestión Humana', solicitante: 'Carolina Marin', necesidades: { teclado: 1, base: 1 } },
  { area: 'Gestión Humana', solicitante: 'Daniella GH', necesidades: { teclado: 1 } },
  { area: 'Gestión Humana', solicitante: 'Adriana Castellano', necesidades: { pantalla: 2 } },
  { area: 'Gestión Humana', solicitante: 'Carlos Olivo', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Planeación', solicitante: 'David Jimenez', necesidades: { teclado: 1 } },
  { area: 'Compras', solicitante: 'Luisa Merlano', necesidades: { teclado: 1, mousepad: 1 } },
  { area: 'Compras', solicitante: 'Richar Bethel', necesidades: { teclado: 1, mousepad: 1 } },
  { area: 'Compras', solicitante: 'Fredy Compras', necesidades: { teclado: 1, mouse: 1, laptop: 1 } },
  { area: 'Compras', solicitante: 'Anita Compras', necesidades: { teclado: 1, mouse: 1, mousepad: 1 } },
  { area: 'Compras', solicitante: 'Yesid Compras', necesidades: { mouse: 1, pantalla: 1 } },
  { area: 'Compras', solicitante: 'Lina Miranda', necesidades: { teclado: 1, mouse: 1, mousepad: 1 } },
  { area: 'Compras', solicitante: 'Kevin Organista', necesidades: { pantalla: 3 } },
  { area: 'Nómina', solicitante: 'Karol Jaramillo', necesidades: { teclado: 1 } },
  { area: 'Nómina', solicitante: 'Samir Nómina', necesidades: { teclado: 1, mousepad: 1 } },
  { area: 'Nómina', solicitante: 'Paola Piña', necesidades: { teclado: 1 } },
  { area: 'Archivo', solicitante: 'Jose Herreta', necesidades: { mousepad: 1 } },
  { area: 'PAE', solicitante: 'Karen Benedetti', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 8, laptop: 1, pantalla: 2, allInOne: 7 } },
  { area: 'Gastronomía', solicitante: 'Nicolas Gomez', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Cadena de Suministros', solicitante: 'Auxiliar de inventario Calle 30', necesidades: { mousepad: 1, allInOne: 1 } },
  { area: 'Jurídico', solicitante: 'Adriana Navarro', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Contratación', solicitante: 'Hamilton', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
  { area: 'Control Interno', solicitante: 'Alix Angulo', necesidades: { teclado: 1, base: 1, mouse: 1, mousepad: 1, laptop: 1 } },
];

const userItems: TechItem[] = sourceRequests.flatMap((request, requestIndex) =>
  (Object.entries(request.necesidades) as [ItemKey, number][]).map(([key, cantidad], itemIndex) => {
    const definition = itemDefinitions[key];
    return {
      id: `usr-${requestIndex + 1}-${itemIndex + 1}`,
      ...definition,
      area: request.area,
      solicitante: request.solicitante,
      cantidadSolicitada: cantidad,
      estado: 'Pendiente',
      cantidadAprobada: 0,
      comentarioGerencia: '',
    };
  })
);

const technicalItems: TechItem[] = [
  ['Mouse ergonómico', 8, 'Ergonomía', 'Media'],
  ['Drum Brother', 8, 'Continuidad operativa', 'Alta'],
  ['Disco duro SSD 2TB', 3, 'Almacenamiento y respaldo', 'Alta'],
  ['Memoria USB 64GB 3.2 Gen 1', 3, 'Herramientas de soporte', 'Media'],
  ['Disco SSD SATA 480GB', 2, 'Mantenimiento de equipos', 'Alta'],
  ['Disco HDD 2TB', 2, 'Almacenamiento y respaldo', 'Media'],
].map(([elemento, cantidad, categoria, prioridad], index) => ({
  id: `ti-${index + 2}`,
  area: 'Tecnología',
  solicitante: 'Departamento de Tecnología',
  elemento: elemento as string,
  cantidadSolicitada: cantidad as number,
  categoria: categoria as string,
  prioridad: prioridad as Priority,
  justificacion: 'Requerimiento técnico consolidado para soporte y continuidad de la operación.',
  estado: 'Pendiente',
  cantidadAprobada: 0,
  comentarioGerencia: '',
}));

export const initialItems: TechItem[] = [...userItems, ...technicalItems];

// Áreas fijas de la empresa — siempre visibles en la tabla aunque estén vacías
export const PREDEFINED_AREAS: string[] = [
  'Contabilidad', 'Gestión Humana', 'Planeación', 'Compras', 'Nómina',
  'Archivo', 'PAE', 'Gastronomía', 'Cadena de Suministros', 'Jurídico',
  'Contratación', 'Control Interno', 'Tecnología',
];
