import React from 'react';
import { createRoot } from 'react-dom/client';
import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@fontsource/roboto';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <WalletProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </WalletProvider>
);