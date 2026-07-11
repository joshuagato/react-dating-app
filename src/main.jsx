import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
    
    <StrictMode>
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <App />
                    <ToastContainer />
                </BrowserRouter>
            </QueryClientProvider>
        </HelmetProvider>
    </StrictMode>,
)
