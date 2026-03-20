import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove initial loader when React mounts
const removeLoader = () => {
  document.body.classList.add('app-loaded');
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Signal that app has loaded
removeLoader();
