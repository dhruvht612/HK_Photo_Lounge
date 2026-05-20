import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ClerkTokenBridge } from './clerk/ClerkTokenBridge.jsx';
import { isClerkEnabled } from './clerk/config.js';
import App from './App.jsx';
import './index.css';

function AppTree() {
  return (
    <BrowserRouter>
      {isClerkEnabled && <ClerkTokenBridge />}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}

const root = (
  <StrictMode>
    {isClerkEnabled ? (
      <ClerkProvider afterSignOutUrl="/">
        <AppTree />
      </ClerkProvider>
    ) : (
      <AppTree />
    )}
  </StrictMode>
);

createRoot(document.getElementById('root')).render(root);
