import { useState, useCallback } from 'react';
import type { ReportStatus } from './types';
import { useAuth } from './contexts/AuthContext';
import { useRequisicion } from './hooks/useRequisicion';
import { useRevisiones } from './hooks/useRevisiones';
import Header from './components/Header';
import ExecutiveMessage from './components/ExecutiveMessage';
import SummaryCards from './components/SummaryCards';
import ProgressSummary from './components/ProgressSummary';
import ApprovalTable from './components/ApprovalTable';
import ExportButton from './components/ExportButton';
import RevisionesPanel from './components/RevisionesPanel';
import ImportExcelButton from './components/ImportExcelButton';
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

  const { role, loading: authLoading, signOut } = useAuth();
  const {
    items,
    syncStatus,
    updateItem,
    addItem,
    deleteItem,
    renameArea,
    renameSolicitante,
    approveAll,
    resetAll,
    manualSave,
  } = useRequisicion(role ?? undefined);

  const { revisiones, addRevision, updateRevision } = useRevisiones();

  // Guarda snapshot y restaura tabla a datos iniciales (nunca deja la tabla en blanco)
  const handleCloseRevision = useCallback(() => {
    if (items.length === 0) return;
    addRevision(items);
    void resetAll();
  }, [items, addRevision, resetAll]);

  if (!passed) return <LandingPage onEnter={() => setPassed(true)} />;
  if (authLoading) return <LoadingScreen />;
  if (role === null) return <LoginPage />;

  const reportStatus = deriveReportStatus(items);
  const canApprove = role === 'gerencia';

  return (
    <div className="app-wrapper">
      <Header
        reportStatus={reportStatus}
        reportDate={reportDate}
        userEmail={role ?? undefined}
        userRole={role}
        onSignOut={() => void signOut()}
      />
      <ExecutiveMessage />
      <ProgressSummary items={items} />
      <ApprovalTable
        items={items}
        canApprove={canApprove}
        onUpdateItem={updateItem}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        onRenameArea={renameArea}
        onRenameSolicitante={renameSolicitante}
        onApproveAll={approveAll}
        onResetAll={() => void resetAll()}
      />
      <SummaryCards items={items} />
      <ImportExcelButton onAddItem={addItem} />
      <ExportButton
        items={items}
        syncStatus={syncStatus}
        role={role}
        onSave={manualSave}
      />
      {canApprove && (
        <RevisionesPanel
          revisiones={revisiones}
          currentItemCount={items.length}
          onCloseRevision={handleCloseRevision}
          onUpdateRevision={updateRevision}
        />
      )}
    </div>
  );
}

export default App;
