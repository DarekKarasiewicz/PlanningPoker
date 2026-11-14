import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// No StrictMode: its double-mounted effects would open the PeerJS room id twice.
createRoot(document.getElementById('root')!).render(<App />);
