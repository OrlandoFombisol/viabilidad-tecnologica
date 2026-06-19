import { useState } from 'react';
import type { ReportStatus } from './types';
import { useAuth } from './contexts/AuthContext';
import { useRequisicion } from './hooks/useRequisicion';
import Header from './components/Header';
import ExecutiveMessage from './components/ExecutiveMessage';
import SummaryCards from './components/SummaryCards';
import ProgressSummary from './components/ProgressSummary';
import ApprovalTable from './components/ApprovalTable';
import ExportButton from './components/ExportButton';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import './styles/global.css';

function deriveReportStatus(items: { estado: string }[]): ReportStatus {
  const total    = items.length;
  const approved = items.filter((i) => i.estado === 'Aprobado').length;
  const denied   = items.filter((i) => i.estado === 'Negado').length;
  const pending  = items.filter((i) => i.estado === 'Pendiente').length;

  if (pending === total) return 'Pendiente de revisión';
  if (denied  === total) return 'Negado';
  if (approved === total) return 'Aprobado';
  return 'Aprobado parcialmente';
}

const reportDate = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030b18' }}>
      <div style={{ textAlign: 'center', color: '#5a7a9d' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #1a3a5c', borderTopColor: '#0d7de8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cargando…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function App() {
  const [passed, setPassed] = useState(false);

  const { user, role, loading: authLoading, signOut } = useAuth();
  const {
    items,
    syncStatus,
    updateItem,
    addItem,
    deleteItem,
    approveAll,
    resetAll,
    manualSave,
  } = useRequisicion(user?.email);

  // Pantalla inicial animada — siempre se muestra primero
  if (!passed) {
    return <LandingPage onEnter={() => setPassed(true)} />;
  }

  // Auth cargando
  if (authLoading) return <LoadingScreen />;

  // No autenticado o sin perfil asignado
  if (!user || role === null) return <LoginPage />;

  const reportStatus = deriveReportStatus(items);
  const readOnly = role === 'tecnologia';

  return (
    <div className="app-wrapper">
      <Header
        reportStatus={reportStatus}
        reportDate={reportDate}
        userEmail={user.email ?? undefined}
        userRole={role}
        onSignOut={() => void signOut()}
      />
      <ExecutiveMessage />
      <ProgressSummary items={items} />
      <ApprovalTable
        items={items}
        readOnly={readOnly}
        onUpdateItem={updateItem}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        onApproveAll={approveAll}
        onResetAll={() => void resetAll()}
      />
      <SummaryCards items={items} />
      <ExportButton
        items={items}
        syncStatus={syncStatus}
        role={role}
        onSave={manualSave}
      />
    </div>
  );
}

export default App;
