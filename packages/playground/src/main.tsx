import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../node_modules/@markdown2ui/react/src/styles/m2u.css'
import './styles.css'
import './renderers/renderers.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
