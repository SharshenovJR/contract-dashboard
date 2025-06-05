import React from 'react';
import ReactDOM from 'react-dom/client'; // или 'react-dom' для старых версий
import App from './App';
// Убедитесь, что у вас есть корневой элемент в public/index.html (обычно <div id="root"></div>)
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);