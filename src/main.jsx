import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';

import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient()
// const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID = "308055312006-tkaegbj35o95b7o24p785m25cs3rgjtd.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(

    <StrictMode>
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <App />
                    </GoogleOAuthProvider>
                    <ToastContainer />
                </BrowserRouter>
            </QueryClientProvider>
        </HelmetProvider>
    </StrictMode>,
)
