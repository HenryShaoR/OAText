import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import WebSocketProvider from './WebSocketContext.tsx'; // Import the WebSocketProvider

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <WebSocketProvider>
            <App />
        </WebSocketProvider>
    </StrictMode>
);
