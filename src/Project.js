import React from 'react';
import ReactDOM from 'react-dom/client';
import ProjectDashboard from './components/ProjectDashboard';
import './styles/App.css';

const container = document.getElementById('root'); 
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ProjectDashboard />
    </React.StrictMode>
  );
} else {
    console.error('Root element for project not found. Make sure public/project.html has a div with id="root".')
}