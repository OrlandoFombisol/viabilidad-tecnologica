import React from 'react';
import '../styles/ExecutiveMessage.css';

const ExecutiveMessage: React.FC = () => (
  <section className="executive-message">
    <div className="exec-marker">Concepto TI</div>
    <div className="exec-content">
      <h2 className="exec-title">Decisión solicitada a Gerencia</h2>
      <p className="exec-lead">
        Como resultado del levantamiento realizado con las áreas y de la evaluación técnica de las
        necesidades reportadas, el Departamento de Tecnología presenta las solicitudes que considera
        pertinentes para mantener la continuidad, capacidad y condiciones adecuadas de operación.
      </p>
      <p className="exec-body">
        Se solicita a Gerencia <strong>aprobar, negar o aprobar parcialmente</strong> cada requerimiento.
        Esta revisión constituye la autorización de viabilidad; únicamente las cantidades aprobadas
        conformarán el consolidado que se remitirá posteriormente a Compras.
      </p>
    </div>
  </section>
);

export default ExecutiveMessage;
