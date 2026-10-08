import React from 'react';
import ReactDOM from 'react-dom/client';
import ActivityDashboard from './components/ActivityDashboard';
import './styles/App.css';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ActivityDashboard />
    </React.StrictMode>
  );
} else {
    console.error('Root element for activity not found. Make sure public/activity.html has a div with id="root".')
}
