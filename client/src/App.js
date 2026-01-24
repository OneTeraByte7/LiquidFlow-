import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Chat from './components/Chat';
import Trading from './components/Trading';
import TradeHistory from './components/TradeHistory';
import Charts from './components/Charts';
import HyperliquidSpotData from './components/spot';
import Wallet from './components/Wallet';
import Vault from './components/Vault';
import VaultDetails from './components/VaultDetails';

import './index.css';

const APP_ID = process.env.PRIVY_APP_ID || 'cmel030zf01a6jv0cv2qjl6wa';

function App() {
  // Dynamically use the current origin for WalletConnect metadata
  const privyConfig = useMemo(() => ({
    appearance: {
      theme: 'light',
      accentColor: '#14b8a6',
    },
    walletConnect: {
      metadata: {
        name: 'My App',
        description: 'Trading Dashboard',
        url: window.location.origin, // fixes metadata.url warning
        icons: [],
      },
    },
  }), []);

  return (
    <PrivyProvider appId={APP_ID} config={privyConfig}>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="chat" element={<Chat />} />
                <Route path="trading" element={<Trading />} />
                <Route path="spot" element={<HyperliquidSpotData />} />
                <Route path="history" element={<TradeHistory />} />
                <Route path="charts" element={<Charts />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="vault" element={<Vault />} />
                <Route path="vault/:vaultAddress" element={<VaultDetails />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </PrivyProvider>
  );
}

export default App;
