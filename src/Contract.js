import React from 'react';
import ReactDOM from 'react-dom/client';
import ContractDashboard from './components/ContractDashboard';
import './styles/App.css';

const container = document.getElementById('root'); 
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ContractDashboard />
    </React.StrictMode>
  );
} else {
    console.error('Root element for contract not found. Make sure public/contract.html has a div with id="root".')
}
