import React from 'react';
import ReactDOM from 'react-dom/client'; // или 'react-dom' для старых версий
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './components/ContractDashboard';
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);