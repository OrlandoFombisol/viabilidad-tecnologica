export type Database = {
  public: {
    Tables: {
      solicitudes: {
        Row: {
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
          created_at: string;
        };
        Insert: {
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
          ultimo_modificado_por?: string | null;
          ultimo_modificado_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          area?: string;
          solicitante?: string;
          categoria?: string;
          elemento?: string;
          cantidad_solicitada?: number;
          justificacion?: string;
          prioridad?: string;
          estado?: string;
          cantidad_aprobada?: number;
          comentario_gerencia?: string;
          urgente?: boolean;
          ultimo_modificado_por?: string | null;
          ultimo_modificado_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      perfiles: {
        Row: {
          id: string;
          email: string;
          rol: 'gerencia' | 'tecnologia';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          rol: 'gerencia' | 'tecnologia';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          rol?: 'gerencia' | 'tecnologia';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
